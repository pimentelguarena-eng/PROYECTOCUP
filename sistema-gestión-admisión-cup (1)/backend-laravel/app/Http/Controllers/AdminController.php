<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Carrera;
use App\Models\Pago;
use App\Models\Nota;
use App\Models\Bitacora;
use App\Models\Estudiante;

class AdminController extends Controller
{
    /**
     * Fetch central system statistics for dashboard components
     */
    public function getStats(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'Sin permisos.'], 403);
        }

        $totalApplicants = Estudiante::count();
        $totalApproved = Estudiante::where('estado_cup', 'Aprobado')->count();
        
        // Sum total validated payments (Monto is 700.00 each)
        $paymentsValidated = Pago::where('estado_pago', 'Pagado')->count();
        $collectedAmounts = Pago::where('estado_pago', 'Pagado')->sum('monto');

        $carreras = Carrera::all();

        return response()->json([
            'metrics' => [
                'total_postulantes' => $totalApplicants,
                'total_aprobados' => $totalApproved,
                'pagos_validados' => $paymentsValidated,
                'recaudacion_total_bs' => $collectedAmounts
            ],
            'carreras' => $carreras
        ]);
    }

    /**
     * Get system audit trails for administration dashboard
     */
    public function getAuditLogs(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $logs = Bitacora::with('usuario')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($logs);
    }

    /**
     * Update individual academic program slot limits (Cupo Máximo)
     */
    public function updateCareerQuota(Request $request, $id)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'Solo administradores pueden realizar esta acción.'], 403);
        }

        $request->validate(['cupo_maximo' => 'required|integer|min:1|max:1000']);

        $carrera = Carrera::findOrFail($id);
        $carrera->update(['cupo_maximo' => $request->input('cupo_maximo')]);
        
        Bitacora::create([
            'usuario_id' => $user->id,
            'accion' => "Modificó cupo máximo de la carrera ({$carrera->nombre}) a [{$request->input('cupo_maximo')}].",
            'modulo' => 'ADMIN CONFIG',
            'ip_address' => $request->ip() ?: '190.181.240.100'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Límite de cupo CUP de carrera procesado exitosamente.',
            'carrera' => $carrera
        ]);
    }

    /**
     * Get students list with pending financial reviews
     */
    public function getPendingPayments(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'Restringido.'], 403);
        }

        $pending = Pago::with('estudiante.usuario')
            ->where('estado_pago', 'Pendiente')
            ->get();

        return response()->json($pending);
    }

    /**
     * Validate/Approve standard student transaction voucher
     */
    public function verifyPayment(Request $request, $id)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'Límite de roles.'], 403);
        }

        $request->validate(['validate' => 'required|boolean']);

        $pago = Pago::with('estudiante.usuario')->findOrFail($id);
        
        if ($request->input('validate')) {
            $pago->update([
                'estado_pago' => 'Pagado',
                'fecha_pago' => now()
            ]);

            // Al validar el pago, el estudiante pasa de 'Postulante' a 'Inscrito' automáticamente
            if ($pago->estudiante) {
                $pago->estudiante->update(['estado_cup' => 'Inscrito']);
            }

            $actionStr = "Aprobó comprobante de pago de 700Bs del Postulante Nro. Factura: {$pago->nro_factura}";
        } else {
            // Revert state
            $pago->update([
                'estado_pago' => 'Pendiente',
                'fecha_pago' => null
            ]);

            // Al revertir el pago, vuelve a ser 'Postulante'
            if ($pago->estudiante) {
                $pago->estudiante->update(['estado_cup' => 'Postulante']);
            }

            $actionStr = "Marcó como Pendiente/Invitado comprobante de depósito del Postulante.";
        }

        Bitacora::create([
            'usuario_id' => $user->id,
            'accion' => $actionStr,
            'modulo' => 'PAGOS_ADMIN',
            'ip_address' => $request->ip() ?: '190.181.240.100'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estatus de pago actualizado satisfactoriamente.',
            'payment' => $pago
        ]);
    }

    /**
     * CRITICAL CORE CUP ALGORITHM:
     * Closes current CUP registry admissions of the FICCT and computes actual assignment places order descending by student GPA averages.
     */
    public function closePeriodAndAwardCupos(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador') {
            return response()->json(['message' => 'La asignación oficial solo puede ser ejecutada por el Administrador Central.'], 403);
        }

        // Run transaction safely
        DB::transaction(function () use ($user, $request) {
            $carreras = Carrera::all();
            
            // Limit counters per Career Option
            $quotaCounters = [];
            $quotas = [];
            foreach ($carreras as $c) {
                $quotaCounters[$c->id] = 0;
                $quotas[$c->id] = $c->cupo_maximo;
            }

            // Retrieve student details
            $students = Estudiante::with('pagos')->get();

            // Calculate overall GPAs of students
            $eligibleStudents = [];
            foreach ($students as $st) {
                // Fetch relevant notas matching enrolled subjects
                $subjectGrades = Nota::where('estudiante_id', $st->usuario_id)->get();
                
                $gpa = 0;
                if ($subjectGrades->count() > 0) {
                    $sum = 0;
                    foreach ($subjectGrades as $n) {
                        $sum += ($n->nota_parcial_1 + $n->nota_parcial_2 + $n->nota_examen_final) / 3;
                    }
                    $gpa = $sum / $subjectGrades->count();
                }

                $activePago = $st->pagos->first();
                $hasPaid = ($activePago && $activePago->estado_pago === 'Pagado');
                $meetsPrerequisites = ($hasPaid && $st->titulo_bachiller);

                $eligibleStudents[] = [
                    'student_id' => $st->usuario_id,
                    'meets_prereq' => $meetsPrerequisites,
                    'gpa' => $gpa,
                    'detail' => $st
                ];
            }

            // Sort students based on pre-requisites and scores (Averages descending)
            // Students with meets_prereq = true and GPA >= 60 are Sorted first to access limited quotas
            usort($eligibleStudents, function ($a, $b) {
                if ($a['meets_prereq'] !== $b['meets_prereq']) {
                    return $b['meets_prereq'] <=> $a['meets_prereq'];
                }
                return $b['gpa'] <=> $a['gpa'];
            });

            // Distribute limited program seats
            foreach ($eligibleStudents as $packaged) {
                $stDetail = $packaged['detail'];
                $hasPaidAndDocs = $packaged['meets_prereq'];
                $gpaScore = $packaged['gpa'];

                if (!$hasPaidAndDocs) {
                    $stDetail->estado_cup = 'Postulante'; // Kept as applicant, cannot approve
                } elseif ($gpaScore >= 60) {
                    // Check Option 1
                    $op1Id = $stDetail->carrera_opcion_1;
                    $careerQuota1 = $quotas[$op1Id] ?? 0;

                    // Check Option 2
                    $op2Id = $stDetail->carrera_opcion_2;
                    $careerQuota2 = $quotas[$op2Id] ?? 0;

                    if ($quotaCounters[$op1Id] < $careerQuota1) {
                        $stDetail->estado_cup = 'Aprobado';
                        $quotaCounters[$op1Id]++;
                    } elseif ($quotaCounters[$op2Id] < $careerQuota2) {
                        $stDetail->estado_cup = 'Aprobado';
                        $quotaCounters[$op2Id]++;
                    } else {
                        // Saturated status: Approved academically but out of spots
                        $stDetail->estado_cup = 'Inscrito'; // Remains as base admit pending next term
                    }
                } else {
                    $stDetail->estado_cup = 'Reprobado';
                }

                $stDetail->save();
            }

            Bitacora::create([
                'usuario_id' => $user->id,
                'accion' => "Cierre oficial del periodo de admisiones CUP. Cupos asignados en orden de mérito de rendimiento académico en PostgreSQL.",
                'modulo' => 'CERRAR_CUP',
                'ip_address' => $request->ip() ?: '190.181.240.100'
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Proceso selectivo CUP cerrado oficialmente. Los postulantes han sido adjudicados de acuerdo a su promedio de calificación (GPA) y cupo de vacantes.'
        ]);
    }
}
