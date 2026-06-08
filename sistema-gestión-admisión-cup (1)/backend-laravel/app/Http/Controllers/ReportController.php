<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Grupo;
use App\Models\Nota;
use App\Models\Carrera;

class ReportController extends Controller
{
    /**
     * Get statistics charts of Approved/Reprobado/Postulantes counts
     */
    public function getOverallStatistics(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador' && $user->rol_nombre !== 'Docente') {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // Gather count stats grouped by status
        $statusCounts = DB::table('estudiantes')
            ->select('estado_cup', DB::raw('count(*) as total'))
            ->groupBy('estado_cup')
            ->get();

        // Gather average GPA per Carrera
        $carreras = Carrera::all();
        $carreraGpa = [];

        foreach ($carreras as $c) {
            $studentIds = DB::table('estudiantes')
                ->where('carrera_opcion_1', $c->id)
                ->orWhere('carrera_opcion_2', $c->id)
                ->pluck('usuario_id');

            $avgGpa = 0;
            if ($studentIds->count() > 0) {
                $avgGpa = Nota::whereIn('estudiante_id', $studentIds)->avg('nota_final_materia') ?: 0;
            }

            $carreraGpa[] = [
                'carrera_id' => $c->id,
                'nombre' => $c->nombre,
                'promedio_general' => round($avgGpa, 1)
            ];
        }

        return response()->json([
            'status_distribution' => $statusCounts,
            'carrera_competitivity_gpa' => $carreraGpa
        ]);
    }

    /**
     * Compare course performance rankings across groups and professor units
     */
    public function getCoursePerformanceRankings(Request $request)
    {
        $user = $request->user();
        if ($user->rol_nombre !== 'Administrador' && $user->rol_nombre !== 'Docente') {
            return response()->json(['message' => 'Solo docentes o administradores pueden acceder.'], 403);
        }

        $groups = Grupo::with(['materia', 'docente'])->get();
        $rankings = [];

        foreach ($groups as $g) {
            // Relational fetch through pivot
            $studentIds = $g->estudiantes()->pluck('estudiante_id')->toArray();
            
            $average = 0;
            $approvedCount = 0;
            $totalCount = count($studentIds);

            if ($totalCount > 0) {
                $average = Nota::whereIn('estudiante_id', $studentIds)
                    ->where('materia_id', $g->materia_id)
                    ->avg('nota_final_materia') ?: 0;

                // Approved are students scoring >= 60 in that specific subject
                $approvedCount = Nota::whereIn('estudiante_id', $studentIds)
                    ->where('materia_id', $g->materia_id)
                    ->where('nota_final_materia', '>=', 60)
                    ->count();
            }

            $rankings[] = [
                'grupo_id' => $g->id,
                'grupo_sigla' => $g->sigla,
                'materia' => $g->materia->nombre,
                'docente_nombre' => $g->docente ? $g->docente->nombre_completo : 'Sin Designar',
                'promedio_calificacion' => round($average, 1),
                'porcentaje_aprobacion' => $totalCount > 0 ? round(($approvedCount / $totalCount) * 100, 1) : 0.0,
                'total_estudiantes' => $totalCount
            ];
        }

        // Sort descending by highest group average
        usort($rankings, function ($a, $b) {
            return $b['promedio_calificacion'] <=> $a['promedio_calificacion'];
        });

        return response()->json($rankings);
    }
}
