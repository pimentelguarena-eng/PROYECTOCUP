import React, { useState } from 'react';
import { Usuario, EstudianteDetalle, Pago, Grupo, Nota, DocenteDetalle, Carrera, Materia } from '../types';
import { getEnforcedAdmissions } from '../dataStore';
import { BarChart, BookOpen, User, Users, FileText, CheckCircle, XCircle, Printer, Download, Building } from 'lucide-react';

interface ReportPanelProps {
  usuarios: Usuario[];
  estudiantes: EstudianteDetalle[];
  payments: Pago[];
  grupos: Grupo[];
  grades: Nota[];
  carreras: Carrera[];
  materias: Materia[];
}

export default function ReportPanel({
  usuarios,
  estudiantes,
  payments,
  grupos,
  grades,
  carreras,
  materias
}: ReportPanelProps) {
  const [reportFilter, setReportFilter] = useState<'todos' | 'aprobados' | 'reprobados' | 'grupos' | 'materias' | 'docentes'>('todos');

  // Enforced academic outcome details
  const stateSnapshot: any = { 
    usuarios, 
    estudiantes, 
    pagos: payments, 
    notas: grades, 
    carreras, 
    grupos, 
    docentes: [], 
    asistencias: [], 
    bitacoras: [], 
    materias, 
    historialAprobados: [],
    periodoActivo: '2026/1',
    periodos: ['2026/1', '2026/2'],
    cuposCarreras: [],
    notaMinimaAprobacion: 60
  };
  const admissionResults = getEnforcedAdmissions(stateSnapshot);

  // 1. Filter applicants lists
  const approvedList = admissionResults.filter(a => a.estado_definitivo === 'Aprobado');
  const reprobadosList = admissionResults.filter(a => a.estado_definitivo === 'Reprobado');

  // 2. Statistics per subject
  const subjectStats = materias.map(m => {
    const subjectGrades = grades.filter(g => g.materia_id === m.id);
    const totalGradesCount = subjectGrades.length;
    
    // Sum final grades
    const sum = subjectGrades.reduce((acc, g) => acc + g.nota_final_materia, 0);
    const avg = totalGradesCount > 0 ? sum / totalGradesCount : 0;

    // Filter Aprobados (>=60)
    const passedCount = subjectGrades.filter(g => g.nota_final_materia >= 60).length;
    const passRate = totalGradesCount > 0 ? Math.round((passedCount / totalGradesCount) * 100) : 0;

    return {
      id: m.id,
      nombre: m.nombre,
      alumnosEvaluados: totalGradesCount,
      promedio_general: avg,
      aprobados_count: passedCount,
      tasa_aprobacion: passRate
    };
  });

  // 3. Groups with highest amount of approved students
  const groupsRank = grupos.map(g => {
    const studentsInGroup = g.estudiantes_ids;
    // Find how many approved students are in this group
    const approvedCount = studentsInGroup.filter(estId => {
      const studentResult = admissionResults.find(a => a.estudiante_id === estId);
      return studentResult?.estado_definitivo === 'Aprobado';
    }).length;

    const mat = materias.find(m => m.id === g.materia_id);
    const doc = usuarios.find(u => u.id === g.docente_id);

    return {
      grupo_id: g.id,
      sigla: g.sigla,
      turno: g.turno,
      materia_nombre: mat?.nombre || 'General',
      docente_nombre: doc?.nombre_completo || 'Sin Designar',
      total_estudiantes: studentsInGroup.length,
      aprobados_count: approvedCount
    };
  }).sort((a, b) => b.aprobados_count - a.aprobados_count);

  const simulatePrint = () => {
    window.print();
  };

  // Metrics for mandatory reporting
  const totalInscritos = estudiantes.length;
  const groupsCount = grupos.length;
  const overallAvg = admissionResults.length > 0 
    ? admissionResults.reduce((acc, r) => acc + r.gpa, 0) / admissionResults.length 
    : 0;

  const shiftStats = ['Mañana', 'Tarde', 'Noche'].map(shift => {
    const shiftGroups = grupos.filter(g => g.turno === shift);
    return {
      turno: shift,
      count: shiftGroups.length
    };
  });

  return (
    <div id="reportes-portal" className="space-y-8">
      
      {/* Upper Global Metrics Overview (Mandatory Params) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border-2 border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block mb-1">Promedios Generales (CUP)</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-mono font-black">{overallAvg.toFixed(2)}</h3>
              <span className="text-xs text-slate-400">pts / 100</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Media académica global de la facultad</p>
          </div>
          <BarChart className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest block mb-1">Infraestructura CUP</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-mono font-black text-slate-900">{groupsCount}</h3>
              <span className="text-xs text-slate-400 font-bold uppercase">Grupos Habilitados</span>
            </div>
            <div className="flex gap-3 mt-2">
              {shiftStats.map(s => (
                <div key={s.turno} className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-black uppercase">{s.turno}</span>
                  <span className="text-xs font-mono font-black text-indigo-600">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          <Building className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 rotate-12 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest block mb-1">Capacidad Logística</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-mono font-black text-slate-900">{totalInscritos}</h3>
              <span className="text-xs text-slate-400 font-bold uppercase">Inscritos Totales</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Distribución dinámica en PostgreSQL</p>
          </div>
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 rotate-12 group-hover:scale-110 transition-transform" />
        </div>
      </div>
      
      {/* Report Header Selector */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 pl-1">
          <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest block">Consola Central de Inteligencia Académica</span>
          <h2 className="text-2xl font-black text-slate-905 flex items-center gap-2 uppercase tracking-tight">
            <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
            Reportes Académicos Oficiales CUP
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            FICCT - Análisis transversal de admisiones y optimización de infraestructura
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={simulatePrint}
            className="cursor-pointer bg-slate-100 border-2 border-slate-250 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-widest py-3 px-5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Selector filters bar */}
      <div className="flex flex-wrap gap-2.5 bg-slate-100/50 p-2 rounded-2xl border-2 border-slate-200">
        
        <button
          onClick={() => setReportFilter('todos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Lista General
        </button>

        <button
          onClick={() => setReportFilter('aprobados')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'aprobados'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Aprobados ({approvedList.length})
        </button>

        <button
          onClick={() => setReportFilter('reprobados')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'reprobados'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Reprobados ({reprobadosList.length})
        </button>

        <button
          onClick={() => setReportFilter('materias')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'materias'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Estadísticas de Materias
        </button>

        <button
          onClick={() => setReportFilter('grupos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'grupos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Aprobación por Grupo
        </button>

        <button
          onClick={() => setReportFilter('docentes')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider ${
            reportFilter === 'docentes'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75'
          }`}
        >
          Docentes por Grupo
        </button>
      </div>

      {/* FILTER VIEWS MAPPING      {/* Tab: General, Approved or Reprobados Lists */}
      {(reportFilter === 'todos' || reportFilter === 'aprobados' || reportFilter === 'reprobados') && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b-2 border-slate-200">
            <h3 className="font-sans font-black text-slate-905 text-sm uppercase tracking-wider">
              {reportFilter === 'todos' ? 'Lista Completa de Postulantes Enrolados' : `Registro Universitario: Alumnos ${reportFilter.toUpperCase()}`}
            </h3>
          </div>

          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left font-sans text-slate-705">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200">
                <tr>
                  <th className="py-3 px-4">C.I. / Registro</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4 text-center">Promedio General</th>
                  <th className="py-3 px-4">Estado CUP</th>
                  <th className="py-3 px-4">Carrera Admitido / Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {(reportFilter === 'todos' ? admissionResults : reportFilter === 'aprobados' ? approvedList : reprobadosList).map(r => (
                  <tr key={r.estudiante_id} className="hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="block font-black text-slate-800">{r.ci}</span>
                      <span className="text-[10px] font-bold text-slate-400">REG: {usuarios.find(u => u.id === r.estudiante_id)?.codigo_registro}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm uppercase">{r.nombre_completo}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">{r.gpa.toFixed(1)} pts</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.estado_definitivo === 'Aprobado' ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg font-black tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">APROBADO</span>
                      ) : r.estado_definitivo === 'Saturado (Sin Cupo)' ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg font-black tracking-wider bg-amber-50 text-amber-805 border border-amber-200">SIN CUPO</span>
                      ) : r.estado_definitivo === 'Reprobado' ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg font-black tracking-wider bg-rose-50 text-rose-800 border border-rose-200">REPROBADO</span>
                      ) : (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg font-black tracking-wider bg-slate-100 text-slate-600 border border-slate-200">POSTULANTE</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="block font-black text-slate-800 uppercase tracking-wide">{r.carrera_nombre_admitida}</span>
                      <p className="text-[10.5px] text-slate-450 leading-snug mt-0.5">{r.observaciones}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Estadisticas por materias */}
      {reportFilter === 'materias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjectStats.map(stat => (
            <div key={stat.id} className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-600 animate-pulse" />
                  <span className="font-sans font-black text-slate-900 text-sm uppercase tracking-wide">{stat.nombre}</span>
                </div>
                <span className="text-[10px] uppercase font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-850">
                  {stat.alumnosEvaluados} Evaluados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-150">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Promedio General</p>
                  <p className="font-mono text-xl font-black text-slate-900 mt-1">
                    {stat.promedio_general.toFixed(1)} pts
                  </p>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-xl border-2 border-indigo-100 text-indigo-955">
                  <p className="text-[9px] text-indigo-400 uppercase font-black tracking-wider">Tasa de Aprobación</p>
                  <p className="font-mono text-xl font-black mt-1">
                    {stat.tasa_aprobacion}%
                  </p>
                </div>
              </div>

              {/* Responsive graphical bar mimicking real charts */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-wider">
                  <span>Porcentaje de Aprobación:</span>
                  <span className="font-black text-slate-800">{stat.tasa_aprobacion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
                  <div
                    className="bg-emerald-500 h-3"
                    style={{ width: `${stat.tasa_aprobacion}%` }}
                    title="Aprobados"
                  ></div>
                  <div
                    className="bg-slate-300 h-3"
                    style={{ width: `${100 - stat.tasa_aprobacion}%` }}
                    title="Reprobados/Faltantes"
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Aprobados: {stat.aprobados_count}</span>
                  <span>Reprobados: {stat.alumnosEvaluados - stat.aprobados_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: ranking de aprobados por grupos */}
      {reportFilter === 'grupos' && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b-2 border-slate-200">
            <h3 className="font-sans font-black text-slate-900 text-sm uppercase tracking-wide">
              Ranking de Grupos por Rendimiento Académico
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Métricas comparativas orientadas al rendimiento por aula docente.</p>
          </div>

          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left font-sans text-slate-755">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-center">Posición</th>
                  <th className="py-3 px-4">Sigla / Turno</th>
                  <th className="py-3 px-4">Área Académica</th>
                  <th className="py-3 px-4">Docente Supervisor</th>
                  <th className="py-3 px-4 text-center">Postulantes Aprobados</th>
                  <th className="py-3 px-4 text-center">Total Aula</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {groupsRank.map((rank, index) => (
                  <tr key={rank.grupo_id} className="hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 font-mono text-base">
                      #{index + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block font-black text-slate-900 uppercase tracking-wide">{rank.sigla}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turno: {rank.turno}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800 uppercase tracking-wide">{rank.materia_nombre}</td>
                    <td className="py-3.5 px-4 text-slate-650 font-bold uppercase tracking-wide text-xs">{rank.docente_nombre}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono bg-emerald-50 text-emerald-800 font-black px-3 py-1.5 rounded-lg border border-emerald-205 text-xs uppercase tracking-wider">
                        {rank.aprobados_count} alumnos
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                      {rank.total_estudiantes} inscritos
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Docentes por grupo */}
      {reportFilter === 'docentes' && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-sans font-black text-slate-900 text-sm uppercase tracking-wide">
                Distribución de Personal Docente por Aula
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Control de supervisión académica y asignación de cátedra.</p>
            </div>
          </div>

          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left font-sans text-slate-755">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nombre del Docente</th>
                  <th className="py-3 px-4 text-center">Sigla Grupo</th>
                  <th className="py-3 px-4">Materia Asignada</th>
                  <th className="py-3 px-4">Turno</th>
                  <th className="py-3 px-4 text-center">Carga de Alumnos</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {grupos.map(g => {
                  const doc = usuarios.find(u => u.id === g.docente_id);
                  const mat = materias.find(m => m.id === g.materia_id);
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 text-sm uppercase">{doc?.nombre_completo || 'SIN DESIGNAR'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {doc?.id || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {g.sigla}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-800 uppercase text-xs">{mat?.nombre || 'General'}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded font-black border border-slate-200 bg-white text-slate-600 uppercase">
                          {g.turno}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-500">
                          {g.estudiantes_ids.length} / {g.cupo_maximo}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
