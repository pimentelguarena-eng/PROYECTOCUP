<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grupo;
use App\Models\User;
use App\Models\Nota;
use App\Models\Bitacora;

class DocenteController extends Controller
{
    /**
     * List all academic groups assigned to the authenticated professor
     */
    public function getMyGroups(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Docente') {
            return response()->json(['message' => 'Rol inválido.'], 403);
        }

        $groups = Grupo::with('materia')
            ->where('docente_id', $user->id)
            ->get();

        return response()->json($groups);
    }

    /**
     * List students and their existing marks for a specific group class
     */
    public function getGroupStudents(Request $request, $id)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Docente') {
            return response()->json(['message' => 'Acceso restringido.'], 403);
        }

        $group = Grupo::where('id', $id)
            ->where('docente_id', $user->id)
            ->firstOrFail();

        // Enrolled Student IDs fetched relational-wise through pivot
        $studentIds = $group->estudiantes()->pluck('usuario_id')->toArray();

        // Fetch User and detail relationships
        $students = User::with(['estudiante', 'notas' => function ($query) use ($group) {
            $query->where('materia_id', $group->materia_id);
        }])
            ->whereIn('id', $studentIds)
            ->get();

        return response()->json([
            'group' => $group,
            'students' => $students
        ]);
    }

    /**
     * Load or update exam scores (Parcial 1, Parcial 2, Final Exam)
     */
    public function saveGrades(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Docente') {
            return response()->json(['message' => 'Operación no permitida.'], 403);
        }

        $request->validate([
            'estudiante_id' => 'required|integer',
            'materia_id' => 'required|integer',
            'p1' => 'required|numeric|min:0|max:10',
            'p2' => 'required|numeric|min:0|max:10',
            'ef' => 'required|numeric|min:0|max:10'
        ]);

        $estudianteId = $request->input('estudiante_id');
        $materiaId = $request->input('materia_id');
        $p1 = $request->input('p1');
        $p2 = $request->input('p2');
        $ef = $request->input('ef');

        // Automated GPA formula based on UAGRM academic system: Average of assessments
        // Scale 0-10 to 0-100 by multiplying by 10
        $pG = round((($p1 + $p2 + $ef) / 3) * 10, 2);

        // Save or update scores
        $nota = Nota::updateOrCreate(
            [
                'estudiante_id' => $estudianteId,
                'materia_id' => $materiaId
            ],
            [
                'nota_parcial_1' => $p1,
                'nota_parcial_2' => $p2,
                'nota_examen_final' => $ef,
                'nota_final_materia' => $pG
            ]
        );

        $studentDoc = User::find($estudianteId);

        // Audit activity
        Bitacora::create([
            'usuario_id' => $user->id,
            'accion' => "Cargó Calificaciones de Estudiante ({$studentDoc->nombre_completo}) - Promedio Materia: {$pG} Pts.",
            'modulo' => 'CALIFICACIONES_CUP',
            'ip_address' => $request->ip() ?: '190.181.240.100'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registro de calificaciones subido y promediado de manera satisfactoria en la base de datos.',
            'grade' => $nota
        ]);
    }
}
