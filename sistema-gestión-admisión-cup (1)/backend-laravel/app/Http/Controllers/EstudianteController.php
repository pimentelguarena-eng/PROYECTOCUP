<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pago;
use App\Models\Estudiante;
use App\Models\Bitacora;

class EstudianteController extends Controller
{
    /**
     * Get applicant profile records
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Estudiante') {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $profile = Estudiante::with(['usuario', 'carreraOpcion1', 'carreraOpcion2', 'pagos'])
            ->where('usuario_id', $user->id)
            ->first();

        return response()->json($profile);
    }

    /**
     * Upload billing voucher receipt for approval
     */
    public function uploadVoucher(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Estudiante') {
            return response()->json(['message' => 'Autenticación incorrecta.'], 403);
        }

        $request->validate([
            'monto' => 'required|numeric',
            'nro_factura' => 'required|string',
            'comprobante_url' => 'required|string'
        ]);

        // Find or create Student payment voucher (Each student has ONE active payment validation loop)
        $pago = Pago::updateOrCreate(
            ['estudiante_id' => $user->id],
            [
                'monto' => 700.00, // Enforced 700.00 Bs. policy
                'nro_factura' => $request->input('nro_factura'),
                'estado_pago' => 'Pendiente', // Requires validation from Carlos Andres Pimentel Garena
                'comprobante_url' => $request->input('comprobante_url'),
                'fecha_pago' => null
            ]
        );

        // Track and audit
        Bitacora::create([
            'usuario_id' => $user->id,
            'accion' => "Cargó boleta de depósito Nro: {$request->input('nro_factura')} para validación de cupo.",
            'modulo' => 'PAGOS',
            'ip_address' => $request->ip() ?: '190.181.240.100'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comprobante financiero recibido con éxito. Está en cola para revisión administrativa.',
            'payment' => $pago
        ]);
    }

    /**
     * Update Student admission criteria documents (Titulo Bachiller)
     */
    public function updateDocuments(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Estudiante') {
            return response()->json(['message' => 'Role no autorizado.'], 403);
        }

        $request->validate([
            'titulo_bachiller' => 'required|boolean',
            'otros_documentos' => 'nullable|string'
        ]);

        $detail = Estudiante::where('usuario_id', $user->id)->firstOrFail();
        $detail->update([
            'titulo_bachiller' => $request->input('titulo_bachiller'),
            'otros_documentos' => $request->input('otros_documentos', '')
        ]);

        // Track and audit
        Bitacora::create([
            'usuario_id' => $user->id,
            'accion' => "Actualizó estatus de documentos académicos (Título Bachiller: " . ($request->input('titulo_bachiller') ? 'SÍ' : 'NO') . ").",
            'modulo' => 'DOCUMENTACIÓN',
            'ip_address' => $request->ip() ?: '190.181.240.100'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Documentación académica modificada exitosamente.',
            'details' => $detail
        ]);
    }
}
