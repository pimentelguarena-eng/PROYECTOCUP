import React, { useState } from 'react';
import { Usuario, DocenteDetalle, Grupo, EstudianteDetalle, Nota, Asistencia, Materia } from '../types';
import { Calendar, Save, Trash, UserCheck, Star, Award, GraduationCap, Check, X, Search, Info } from 'lucide-react';

interface DocentePanelProps {
  user: Usuario;
  docente: DocenteDetalle;
  grupos: Grupo[];
  estudiantes: EstudianteDetalle[];
  usuarios: Usuario[];
  grades: Nota[];
  attendances: Asistencia[];
  materias: Materia[];
  onUpdateGrades: (newGrades: Nota[]) => void;
  onUpdateAttendance: (newAttendances: Asistencia[]) => void;
  onLogAction: (action: string, module: string) => void;
  triggerAlert?: (message: string, title?: string) => void;
  triggerConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function DocentePanel({
  user,
  docente,
  grupos,
  estudiantes,
  usuarios,
  grades,
  attendances,
  materias,
  onUpdateGrades,
  onUpdateAttendance,
  onLogAction,
  triggerAlert,
  triggerConfirm
}: DocentePanelProps) {
  // Find only this teacher's groups
  const docenteGrupos = grupos.filter(g => g.docente_id === user.id);
  
  // Active Selected Group state
  const [selectedGroupId, setSelectedGroupId] = useState(docenteGrupos[0]?.id || '');
  const activeGroup = grupos.find(g => g.id === selectedGroupId);
  const activeMateria = materias.find(m => m.id === activeGroup?.materia_id);

  // Filter student registry belonging to this group
  const groupStudentIds = activeGroup?.estudiantes_ids || [];
  const groupStudents = estudiantes.filter(st => groupStudentIds.includes(st.usuario_id));

  // Attendance Date Select State
  const todayStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Editable grades state
  const [editingGrades, setEditingGrades] = useState<Record<string, { p1: number; p2: number; final: number }>>({});
  const [tempAttendance, setTempAttendance] = useState<Record<string, 'Presente' | 'Falta'>>({});

  // Triggering load of values when changing dropdowns
  React.useEffect(() => {
    if (!selectedGroupId) return;
    const initialEdits: typeof editingGrades = {};
    groupStudents.forEach(st => {
      const studentGrade = grades.find(g => g.estudiante_id === st.usuario_id && g.materia_id === activeGroup?.materia_id) || {
        nota_parcial_1: 0,
        nota_parcial_2: 0,
        nota_examen_final: 0
      };
      initialEdits[st.usuario_id] = {
        p1: studentGrade.nota_parcial_1,
        p2: studentGrade.nota_parcial_2,
        final: studentGrade.nota_examen_final
      };
    });
    setEditingGrades(initialEdits);

    // Initial load for attendances matching current selected date
    const initialAttendance: typeof tempAttendance = {};
    groupStudents.forEach(st => {
      const record = attendances.find(
        a => a.estudiante_id === st.usuario_id && a.grupo_id === selectedGroupId && a.fecha === attendanceDate
      );
      initialAttendance[st.usuario_id] = record ? record.estado : 'Presente'; // Default presence
    });
    setTempAttendance(initialAttendance);
  }, [selectedGroupId, attendanceDate, grades]);

  const handleGradeChange = (studentId: string, examType: 'p1' | 'p2' | 'final', value: string) => {
    // Force bounds: 0 - 100
    let numeric = parseFloat(value);
    if (isNaN(numeric)) numeric = 0;
    if (numeric < 0) numeric = 0;
    if (numeric > 100) numeric = 100;

    setEditingGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examType]: numeric
      }
    }));
  };

  const handleSaveGrades = (studentId: string) => {
    const edits = editingGrades[studentId];
    if (!edits || !activeGroup) return;

    // Recalculate average
    const finalSubjectAvg = parseFloat(((edits.p1 + edits.p2 + edits.final) / 3).toFixed(2));

    const updated = [...grades];
    const index = updated.findIndex(g => g.estudiante_id === studentId && g.materia_id === activeGroup.materia_id);
    
    const studentUser = usuarios.find(u => u.id === studentId);
    const studentName = studentUser?.nombre_completo || 'Estudiante';

    const newGradeNode: Nota = {
      id: index >= 0 ? updated[index].id : `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      estudiante_id: studentId,
      materia_id: activeGroup.materia_id,
      nota_parcial_1: edits.p1,
      nota_parcial_2: edits.p2,
      nota_examen_final: edits.final,
      nota_final_materia: finalSubjectAvg
    };

    if (index >= 0) {
      updated[index] = newGradeNode;
    } else {
      updated.push(newGradeNode);
    }

    onUpdateGrades(updated);
    onLogAction(
      `Docente ${user.nombre_completo} guardó calificaciones para el estudiante ${studentName} en ${activeMateria?.nombre}: [${edits.p1}, ${edits.p2}, ${edits.final}]`,
      'MÓDULO EVALUACIÓN'
    );
  };

  const handleSaveAttendance = (studentId: string, state: 'Presente' | 'Falta') => {
    if (!selectedGroupId) return;

    const studentUser = usuarios.find(u => u.id === studentId);
    const studentName = studentUser?.nombre_completo || 'Estudiante';

    const updated = [...attendances];
    const index = updated.findIndex(
      a => a.estudiante_id === studentId && a.grupo_id === selectedGroupId && a.fecha === attendanceDate
    );

    const matchNode: Asistencia = {
      id: index >= 0 ? updated[index].id : `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      estudiante_id: studentId,
      grupo_id: selectedGroupId,
      fecha: attendanceDate,
      estado: state
    };

    if (index >= 0) {
      updated[index] = matchNode;
    } else {
      updated.push(matchNode);
    }

    // Update temp local reflect state
    setTempAttendance(prev => ({ ...prev, [studentId]: state }));
    onUpdateAttendance(updated);
    
    onLogAction(
      `Asistencia registrada por ${user.nombre_completo} para ${studentName} - Fecha ${attendanceDate}: ${state}`,
      'MÓDULO ASISTENCIA'
    );
  };

  // Search filter
  const filteredStudents = groupStudents.filter(st => {
    const studentUser = usuarios.find(u => u.id === st.usuario_id);
    return studentUser?.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) || 
           studentUser?.ci.includes(searchQuery);
  });

  return (
    <div id="docente-dashboard" className="space-y-8">
      
      {/* Docente Requirements Header */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-600"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 md:pl-1">
            <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest block">Docente Supervisor Oficial</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.nombre_completo.toUpperCase()}</h2>
            <p className="text-xs text-slate-500 font-sans">
              Área de Cátedra: <span className="font-extrabold text-slate-800">{docente.especialidad.toUpperCase()}</span>
            </p>
          </div>
          
          {/* Requirement checklist verification as seen on document page 1 - upgraded with uppercase bold style */}
          <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-wider uppercase">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-250">
              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
              Título Nacional
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
              docente.tiene_maestria 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                : 'bg-amber-50 text-amber-800 border-amber-250'
            }`}>
              <Award className="w-4 h-4 shrink-0" />
              Maestría: {docente.tiene_maestria ? 'SÍ' : 'NO'}
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-250">
              <Star className="w-4 h-4 text-emerald-600 shrink-0" />
              Diplomado Superior
            </span>
          </div>
        </div>
      </div>

      {/* Select class and Group Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left selector col */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md space-y-4">
            <h3 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400">
              Mis Aulas y Grupos
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Grupo de Cátedra:</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 text-xs font-black rounded-xl p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all uppercase"
              >
                {docenteGrupos.length === 0 ? (
                  <option value="">Ningún grupo asignado</option>
                ) : (
                  docenteGrupos.map(g => {
                    const matchMat = materias.find(m => m.id === g.materia_id);
                    return (
                      <option key={g.id} value={g.id}>
                        {matchMat?.nombre.toUpperCase()} - {g.sigla.toUpperCase()} ({g.turno.toUpperCase()})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {activeGroup && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 font-sans text-slate-600">
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Detalle Del Aula</p>
                <p>Materia: <span className="font-extrabold text-slate-900">{activeMateria?.nombre.toUpperCase()}</span></p>
                <p>Turno: <span className="font-extrabold text-slate-900">{activeGroup.turno.toUpperCase()}</span></p>
                <p>Inscritos: <span className="font-extrabold text-slate-900">{groupStudents.length} / {activeGroup.cupo_maximo} alumnos</span></p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(groupStudents.length / activeGroup.cupo_maximo) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt context reminder */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-indigo-900 text-xs flex gap-2">
            <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Reglas de Negocio:</p>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-800">
                <li>Solo se toman 3 exámenes por materia.</li>
                <li>Haga clic en "Guardar Notas" para aplicar cambios individuales.</li>
                <li>Las asistencias se registran instantáneamente por fecha.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right main workspace */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Main Action Toggles: Grades Table vs Attendance Tab */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border-b-2 border-slate-200 p-5 gap-4">
              <div className="flex items-center gap-3">
                <span className="font-sans font-black text-xs uppercase tracking-widest text-slate-400 block mb-1">Planilla Académica Oficial</span>
                <h3 className="font-sans font-black text-sm text-slate-800 hidden">
                  {activeMateria?.nombre} ({activeGroup?.sigla || ''})
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            {/* Attendance Settings Bar */}
            <div className="bg-blue-50/40 p-4 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-sans font-black uppercase tracking-wider text-blue-900">Fecha Asistencia:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black font-mono focus:outline-none focus:border-slate-850"
                />
              </div>
              <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">
                Seleccione la fecha para consignar asistencias abajo
              </span>
            </div>

            {/* Combined registry tables */}
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-sans">
                Ninguno alumno coincide con los filtros especificados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-3.5 px-6">Código / Nombre</th>
                      <th className="py-3.5 px-2 text-center w-[90px]">Parcial 1</th>
                      <th className="py-3.5 px-2 text-center w-[90px]">Parcial 2</th>
                      <th className="py-3.5 px-2 text-center w-[90px]">Examen Final</th>
                      <th className="py-3.5 px-2 text-center">Promedio</th>
                      <th className="py-3.5 px-4 text-center">Registrar</th>
                      <th className="py-3.5 px-6 text-center border-l-2 border-slate-200 bg-slate-50/30">Asistencia del Día</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(st => {
                      const studentUser = usuarios.find(u => u.id === st.usuario_id);
                      if (!studentUser) return null;

                      const edits = editingGrades[st.usuario_id] || { p1: 0, p2: 0, final: 0 };
                      const calculatedAverage = (edits.p1 + edits.p2 + edits.final) / 3;
                      const hasPassed = calculatedAverage >= 60;

                      // Attend state matching local picker
                      const dailyAttendance = tempAttendance[st.usuario_id] || 'Presente';

                      return (
                        <tr key={st.usuario_id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="block font-semibold text-slate-800 leading-snug">{studentUser.nombre_completo}</span>
                            <span className="font-mono text-[10px] text-slate-400">CI: {studentUser.ci} | Reg: {studentUser.codigo_registro}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={edits.p1}
                              onChange={(e) => handleGradeChange(st.usuario_id, 'p1', e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 text-xs text-center font-mono rounded py-1 focus:bg-white"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={edits.p2}
                              onChange={(e) => handleGradeChange(st.usuario_id, 'p2', e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 text-xs text-center font-mono rounded py-1 focus:bg-white"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={edits.final}
                              onChange={(e) => handleGradeChange(st.usuario_id, 'final', e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 text-xs text-center font-mono rounded py-1 focus:bg-white"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${
                              hasPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {calculatedAverage.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleSaveGrades(st.usuario_id)}
                              className="cursor-pointer bg-slate-900 text-white hover:bg-slate-800 p-1.5 rounded transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                              title="Salvar notas de esta materia"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Guardar
                            </button>
                          </td>
                          {/* Attendance Section buttons */}
                          <td className="py-3 px-4 text-center border-l border-slate-100 bg-slate-50/10">
                            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white shadow-sm overflow-hidden text-xs">
                              <button
                                onClick={() => handleSaveAttendance(st.usuario_id, 'Presente')}
                                className={`cursor-pointer px-2.5 py-1.2 rounded-md font-medium transition-all ${
                                  dailyAttendance === 'Presente'
                                    ? 'bg-emerald-600 text-white font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Presente
                              </button>
                              <button
                                onClick={() => handleSaveAttendance(st.usuario_id, 'Falta')}
                                className={`cursor-pointer px-2.5 py-1.2 rounded-md font-medium transition-all ${
                                  dailyAttendance === 'Falta'
                                    ? 'bg-rose-500 text-white font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                Falta
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
