import React, { useState } from 'react';
import { Usuario, EstudianteDetalle, Pago, Nota, Asistencia, Carrera, Materia, Grupo } from '../types';
import { downloadReceiptPDF } from '../lib/pdfGenerator';
import {
  CheckCircle,
  AlertTriangle,
  CreditCard,
  DollarSign,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Download,
  Upload,
  ArrowRight,
  Award,
  Check,
  FileCheck,
  User,
  Clock,
  Key
} from 'lucide-react';
import { calculateStudentGPA } from '../dataStore';
import { div } from 'motion/react-client';

interface EstudiantePanelProps {
  user: Usuario;
  estudiante: EstudianteDetalle;
  payments: Pago[];
  grades: Nota[];
  attendances: Asistencia[];
  carreras: Carrera[];
  materias: Materia[];
  usuarios: Usuario[];
  grupos: Grupo[];
  onUploadVoucher: (reference: string) => void;
  onUpdateDocs: () => void;
  onUpdatePassword: (newPass: string) => void;
  admissionResult: any; // Final outcome with Career allocations
  triggerAlert?: (message: string, title?: string) => void;
  triggerConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function EstudiantePanel({
  user,
  estudiante,
  payments,
  grades,
  attendances,
  carreras,
  materias,
  usuarios,
  grupos,
  onUploadVoucher,
  onUpdateDocs,
  onUpdatePassword,
  admissionResult,
  triggerAlert
}: EstudiantePanelProps) {
  const [voucherRef, setVoucherRef] = useState('');
  const [selectedBank, setSelectedBank] = useState('Banco Unión');
  const [showPayModal, setShowPayModal] = useState(false);
  const [simulatedFileUploaded, setSimulatedFileUploaded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'academico' | 'pagos'>('academico');

  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Find payment status
  const currentPay = payments.find(p => p.estudiante_id === user.id);
  const isPaid = currentPay?.estado_pago === 'Pagado';
  const isPending = currentPay?.estado_pago === 'Pendiente';

  // Find careers list names
  const c1 = carreras.find(c => c.id === estudiante.carrera_opcion_1);
  const c2 = carreras.find(c => c.id === estudiante.carrera_opcion_2);

  // Calculate GPA
  const gpa = calculateStudentGPA(user.id, grades);

  // Group attendance stats
  const totalClasses = attendances.filter(a => a.estudiante_id === user.id).length;
  const presents = attendances.filter(a => a.estudiante_id === user.id && a.estado === 'Presente').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presents / totalClasses) * 100) : 100;

  // Find groups the student is enrolled in
  const myEnrolledGroups = grupos.filter(g => g.estudiantes_ids.includes(user.id));

  // Determine taken exams and overall completeness
  // There are 4 materias, 3 exams each = 12 total exams
  let examsTakenCount = 0;
  let takenExamsList: { materiaId: number; materiaNombre: string; exam: string; score: number }[] = [];

  materias.forEach(m => {
    const studentGrade = grades.find(g => g.materia_id === m.id && g.estudiante_id === user.id);
    if (studentGrade) {
      if (studentGrade.nota_parcial_1 > 0) {
        examsTakenCount++;
        takenExamsList.push({ materiaId: m.id, materiaNombre: m.nombre, exam: 'Parcial 1', score: studentGrade.nota_parcial_1 });
      }
      if (studentGrade.nota_parcial_2 > 0) {
        examsTakenCount++;
        takenExamsList.push({ materiaId: m.id, materiaNombre: m.nombre, exam: 'Parcial 2', score: studentGrade.nota_parcial_2 });
      }
      if (studentGrade.nota_examen_final > 0) {
        examsTakenCount++;
        takenExamsList.push({ materiaId: m.id, materiaNombre: m.nombre, exam: 'Examen Final', score: studentGrade.nota_examen_final });
      }
    }
  });

  const totalExamsOfSystem = materias.length * 3; // 12
  const allExamsCompleted = examsTakenCount === totalExamsOfSystem;

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherRef.trim()) return;
    onUploadVoucher(`${selectedBank} | Ref: ${voucherRef.trim()}`);
    setVoucherRef('');
    setSimulatedFileUploaded(false);
    setShowPayModal(false);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (oldPassword !== user.password) {
      setPasswordError('La contraseña antigua ingresada es incorrecta.');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('La nueva contraseña no puede estar vacía.');
      return;
    }

    if (newPassword === oldPassword) {
      setPasswordError('La nueva contraseña debe ser diferente de la antigua.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    onUpdatePassword(newPassword);

    // reset form and close
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
  };

  // Safe teacher lookup
  const getTeacherForGroup = (docenteId: string | null) => {
    if (!docenteId) return 'MSc. Docente Asignado por la Universidad';
    const found = usuarios.find(u => u.id === docenteId);
    return found ? found.nombre_completo : 'Docente Titular FICCT';
  };

  return (
    <div id="estudiante-portal" className="space-y-6">

      {/* Upper Status Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-sans font-black text-lg border-2 border-slate-700 shadow shrink-0">
            {user.nombre_completo.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-black text-blue-600 tracking-wider">Perfil Académico Activo</span>
            <h3 className="font-sans font-black text-slate-900 leading-tight text-base">{user.nombre_completo.toUpperCase()}</h3>
            <p className="font-mono text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">REGISTRO: {user.codigo_registro}</p>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="mt-1 text-left text-[9px] text-blue-605 hover:text-blue-800 font-sans font-black uppercase tracking-wider underline cursor-pointer flex items-center gap-1 focus:outline-none"
            >
              <Key className="w-3 h-3" /> Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Payment Balance Card */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-black text-slate-400 tracking-wider">Derechos del CUP (700 Bs.)</span>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-lg text-slate-900">700.00 Bs.</span>
              {isPaid ? (
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-105 uppercase tracking-wide">PAGADO</span>
              ) : isPending ? (
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-105 uppercase tracking-wide">EN VERIFICACIÓN</span>
              ) : (
                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-105 uppercase tracking-wide">DEUDA DE ARANCEL</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Matrícula preuniversitaria obligatoria.</p>
          </div>
          <button
            onClick={() => setActiveSubTab('pagos')}
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase text-slate-700 px-3 py-2 rounded-xl border border-slate-200 transition-all shrink-0"
          >
            Ver Formas de Pago
          </button>
        </div>

        {/* Academic GPA overview */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between border-2 border-slate-850 relative md:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[9px] text-blue-405 font-black uppercase tracking-wider">Promedio Parcial (CUP)</span>
            <p className="font-mono text-3xl font-black">{gpa.toFixed(1)} <span className="text-xs text-slate-400">/ 100</span></p>
            <p className="text-[10px] text-slate-400 leading-none">Min. Aprobación: 60 puntos.</p>
          </div>
          <div className="text-right">
            <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black tracking-wider block ${gpa >= 60 ? 'bg-emerald-550/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-550/20 text-rose-400 border border-rose-500/30'
              }`}>
              {gpa >= 60 ? 'PROMEDIO APROBATORIO' : 'REPROBANDO'}
            </span>
          </div>
        </div>

      </div>

      {/* Navigation Inside Student Panel */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-1.5 flex gap-1.5 max-w-md">
        <button
          onClick={() => setActiveSubTab('academico')}
          className={`flex-1 cursor-pointer py-2 px-4 rounded-lg font-sans text-xs font-black uppercase tracking-wider text-center transition-all ${activeSubTab === 'academico'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          Notas, Evaluaciones y Cursos
        </button>
        <button
          onClick={() => setActiveSubTab('pagos')}
          className={`flex-1 cursor-pointer py-2 px-4 rounded-lg font-sans text-xs font-black uppercase tracking-wider text-center transition-all ${activeSubTab === 'pagos'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          Formas de Pago y Registro (700 Bs.)
        </button>
      </div>

      {activeSubTab === 'academico' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Academic Completion Status Card and Cursos asignados */}
          <div className="lg:col-span-1 space-y-6">

            {/* STATUS ADMISSION BANNER */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 space-y-4">
              <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-450 border-b border-slate-105 pb-2">
                Evaluaciones de Admisión CUP
              </h4>

              {/* Progress Checklist bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-700 uppercase">Progreso de Exámenes:</span>
                  <span className="font-mono font-black text-slate-900">{examsTakenCount} / {totalExamsOfSystem}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(examsTakenCount / totalExamsOfSystem) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Consta de 3 exámenes para cada una de las 4 materias curriculares (Computación, Matemáticas, Inglés y Física).
                </span>
              </div>

              {/* Specific "Ya dio todos los exámenes" logic */}
              {allExamsCompleted ? (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 text-orange-850">
                    <Award className="w-5 h-5 text-orange-600 shrink-0" />
                    <span className="font-sans font-black text-xs uppercase tracking-wider">EXÁMENES COMPLETADOS (12/12)</span>
                  </div>
                  <p className="text-xs text-orange-800 leading-snug">
                    Ha completado la totalidad de evaluaciones de la FICCT.
                  </p>

                  {gpa >= 60 ? (
                    <div className="bg-emerald-600 text-white rounded-xl p-3 text-center border border-emerald-700 shadow-md">
                      <span className="text-[9px] font-mono tracking-widest uppercase block text-emerald-100 font-bold">Estado Definitivo:</span>
                      <p className="text-sm font-black font-sans tracking-wide">¡APROBADO PARA ADMISIÓN! 🎉</p>
                      <p className="text-[10px] mt-1 text-emerald-55 font-medium leading-tight">
                        Felicidades, se encuentra admitido oficialmente en: <br />
                        <strong className="underline text-white font-black">{admissionResult?.carrera_nombre_admitida ? admissionResult.carrera_nombre_admitida.toUpperCase() : c1?.nombre.toUpperCase()}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-rose-600 text-white rounded-xl p-3 text-center border border-rose-700 shadow-md">
                      <span className="text-[9px] font-mono tracking-widest uppercase block text-rose-150 font-bold">Estado Definitivo:</span>
                      <p className="text-sm font-black font-sans tracking-wide">REPROBADO ⚠️</p>
                      <p className="text-[10px] mt-1 text-rose-100 font-medium leading-tight">
                        El promedio obtenido ({gpa.toFixed(1)}) es menor al puntaje mínimo de excelencia académica de la FICCT (60.0). No alcanza el cupo directo.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-slate-500 shrink-0 animate-pulse" />
                    <span className="font-sans font-black text-xs uppercase text-slate-700 tracking-wider">PRUEBAS EN DESARROLLO ({examsTakenCount}/12)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Usted registra <span className="font-black text-slate-850 bg-slate-200/85 px-1.5 py-0.5 rounded">{examsTakenCount} exámenes rendidos</span> en el sistema académico. Faltan <strong className="text-blue-600">{12 - examsTakenCount} evaluaciones</strong> por registrar por su docente de área.
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wide italic block bg-white p-2 rounded-lg border border-slate-150">
                    * El estado definitivo se publicará en el panel central de postores una vez que se completen todas las actas de evaluación para el turno {estudiante.turno_preferido.toUpperCase()}.
                  </p>
                </div>
              )}

              {/* Career options chosen */}
              <div className="pt-2 gap-3 space-y-2.5 text-xs">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wide">1ra Opción Seleccionada:</p>
                  <p className="font-sans text-slate-800 font-bold uppercase">{c1?.nombre || 'No asignada'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wide">2da Opción Seleccionada:</p>
                  <p className="font-sans text-slate-800 font-bold uppercase">{c2?.nombre || 'No asignada'}</p>
                </div>
              </div>
            </div>

            {/* CURSOS QUE TIENE (COURSES AND ASSIGNED GROUPS LIST) */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-105 pb-2">
                <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-450 ">
                  Mis Cursos Inscritos ({myEnrolledGroups.length})
                </h4>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider"> FICCT CUP </span>
              </div>

              {myEnrolledGroups.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-xl p-3 text-slate-500 text-xs font-bold font-sans">
                  No se registran grupos asignados formalmente en este momento. Puede registrar materias o solicitar asignación de paralelo.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-sans">
                    Usted se encuentra cursando de manera oficial las siguientes materias preuniversitarias:
                  </p>

                  {myEnrolledGroups.map(g => {
                    const matchedMateria = materias.find(m => m.id === g.materia_id);
                    const docName = getTeacherForGroup(g.docente_id);

                    return (
                      <div key={g.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200.rounded p-3 rounded-xl transition-all space-y-1.5 relative">
                        <div className="flex justify-between items-center">
                          <span className="font-sans font-black text-slate-900 text-xs uppercase tracking-wide">
                            {matchedMateria ? matchedMateria.nombre : 'Materia del CUP'}
                          </span>
                          <span className="text-[9.5px] font-mono font-black text-blue-600 bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded-lg">
                            {g.sigla}
                          </span>
                        </div>
                        <div className="space-y-1 font-sans text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Cátedra: <strong className="text-slate-800 font-bold">{docName}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Horario / Turno: <strong className="text-slate-800">{g.turno}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DOCUMENT SUBMISSION STATUS */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 space-y-3">
              <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-450 border-b border-slate-105 pb-2">
                Documentación Académica
              </h4>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <span className={`w-2 h-2 mt-1.5 rounded-full ${estudiante.titulo_bachiller ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-wide">Título de Bachiller</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Presentación en ventanilla física o digital</p>
                  </div>
                </div>
                {estudiante.titulo_bachiller ? (
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">SÍ</span>
                ) : (
                  <span className="text-[9px] font-black tracking-widest uppercase text-red-650 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">FALTA</span>
                )}
              </div>

              {!estudiante.titulo_bachiller && (
                <button
                  onClick={onUpdateDocs}
                  className="w-full cursor-pointer bg-slate-900 border-2 border-slate-850 text-white text-[10px] font-sans font-black uppercase tracking-widest py-2.5 px-3 rounded-lg hover:bg-slate-800 transition-all text-center mt-2"
                >
                  Subir Copia Título de Bachiller
                </button>
              )}
            </div>

          </div>

          {/* RIGHT COLUMNS: Detailed individual exam scores for each of the materias (Cursos) */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 gap-2">
                <div>
                  <h3 className="font-sans font-black text-slate-900 text-lg uppercase tracking-tight">Detalle de Calificaciones por Examen</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Revise el estado ("si ya dio algún examen qué nota tiene") para cada una de las materias evaluadas.
                  </p>
                </div>
                <div className="font-mono text-xs bg-slate-50 border px-3 py-1.5 rounded-xl text-slate-600 font-bold shrink-0 self-start">
                  Exámenes Rendidos: {examsTakenCount} / 12
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materias.map(m => {
                  const grade = grades.find(g => g.materia_id === m.id && g.estudiante_id === user.id) || {
                    nota_parcial_1: 0,
                    nota_parcial_2: 0,
                    nota_examen_final: 0,
                    nota_final_materia: 0
                  };

                  // Check individual exam statuses
                  const hasP1 = grade.nota_parcial_1 > 0;
                  const hasP2 = grade.nota_parcial_2 > 0;
                  const hasEF = grade.nota_examen_final > 0;

                  // Average calculations
                  const matterAvg = (grade.nota_parcial_1 + grade.nota_parcial_2 + grade.nota_examen_final) / 3;

                  return (
                    <div key={m.id} className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 space-y-3.5 hover:border-slate-350 transition-all relative overflow-hidden flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-500" />
                          <span className="font-sans font-black text-slate-850 text-xs uppercase tracking-wide">{m.nombre}</span>
                        </div>
                        <span className={`text-[9.5px] font-mono font-black tracking-wider px-2 py-0.5 rounded-xl border ${matterAvg >= 60 ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-slate-100 text-slate-550 border-slate-200'
                          }`}>
                          PROM: {matterAvg.toFixed(1)}
                        </span>
                      </div>

                      {/* Display table of 3 exams as requested */}
                      <div className="space-y-2 font-sans text-xs">
                        {/* Examen 1 */}
                        <div className="flex justify-between items-center bg-white border rounded-xl p-2">
                          <span className="font-black text-slate-600 uppercase text-[9.5px]">Examen Parcial I:</span>
                          <div className="flex items-center gap-2">
                            {hasP1 ? (
                              <>
                                <span className="font-mono font-black text-slate-850 bg-slate-100 px-2 py-0.5 rounded text-xs">{grade.nota_parcial_1} pts</span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Rendido</span>
                              </>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 italic">No rendido yet (0 pts)</span>
                            )}
                          </div>
                        </div>

                        {/* Examen 2 */}
                        <div className="flex justify-between items-center bg-white border rounded-xl p-2">
                          <span className="font-black text-slate-600 uppercase text-[9.5px]">Examen Parcial II:</span>
                          <div className="flex items-center gap-2">
                            {hasP2 ? (
                              <>
                                <span className="font-mono font-black text-slate-850 bg-slate-100 px-2 py-0.5 rounded text-xs">{grade.nota_parcial_2} pts</span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Rendido</span>
                              </>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 italic">No rendido yet (0 pts)</span>
                            )}
                          </div>
                        </div>

                        {/* Examen Final */}
                        <div className="flex justify-between items-center bg-white border rounded-xl p-2">
                          <span className="font-black text-slate-600 uppercase text-[9.5px]">Examen Final del CUP:</span>
                          <div className="flex items-center gap-2">
                            {hasEF ? (
                              <>
                                <span className="font-mono font-black text-slate-850 bg-slate-100 px-2 py-0.5 rounded text-xs">{grade.nota_examen_final} pts</span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Rendido</span>
                              </>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 italic">No rendido yet (0 pts)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Visual progress meter for that specific subject area */}
                      <div className="space-y-1 pt-1">
                        <div className="w-full bg-white rounded-full h-1.5 border overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${matterAvg >= 60 ? 'bg-emerald-500' : 'bg-slate-405'}`}
                            style={{ width: `${Math.min(matterAvg, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-405">
                          <span>0 pts</span>
                          <span>Área {matterAvg >= 60 ? 'Aprobada' : 'No alcanzada'}</span>
                          <span>100 pts</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* ATTENDANCE AND HORARIO RECAP */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6">
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <h4 className="font-sans font-black text-slate-850 text-xs uppercase tracking-widest flex items-center gap-2.5">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  Control de Asistencias Presenciales
                </h4>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Mínimo 80% asistencia</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-22 h-22 rounded-2xl border-2 border-slate-200 flex flex-col justify-center items-center shrink-0 bg-slate-50/50">
                  <span className="font-mono text-2xl font-black text-slate-850">{attendanceRate}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Asistencias</span>
                </div>
                <div className="space-y-1 font-sans text-xs text-slate-650 uppercase font-bold">
                  <p className="text-[10px] text-slate-400 font-extrabold pb-0.5">Historial acumulado:</p>
                  <p className="text-slate-800 font-bold">Clases registradas CUP: <span className="font-mono font-black text-slate-900">{totalClasses}</span></p>
                  <p className="text-slate-700">Presente en aula: <span className="font-mono font-black text-emerald-600">{presents}</span></p>
                  <p className="text-slate-700 font-medium">Faltas: <span className="font-mono font-black text-rose-500">{totalClasses - presents}</span></p>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* PAYMENT TAB DETAIL (700 Bs payment methods + submission forms) */
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6 space-y-6">

          <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-sans font-black text-slate-900 text-lg uppercase tracking-tight">Formas de Pago y Verificación de Depósito (FICCT)</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Cumplir con el arancel reglamentario de <strong>700.00 Bs.</strong> es obligatorio para figurar con estado "Inscrito" y habilitar sus materias.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-2 text-emerald-800 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[9px] uppercase font-black leading-none text-emerald-605">Pago Verificado</p>
                    <p className="text-[11.5px] font-mono font-bold leading-normal">Factura: {currentPay?.nro_factura || 'F-2026-9041'}</p>
                  </div>
                </div>
              ) : isPending ? (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-2 text-amber-850 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                  <div>
                    <p className="text-[9px] uppercase font-black leading-none text-amber-600">Revisión Pendiente</p>
                    <p className="text-[10.5px] font-bold leading-normal">Boleto enviado en Cola de espera</p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl px-4 py-2 text-rose-850 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-[9px] uppercase font-black leading-none text-rose-600">Arancel Pendiente</p>
                    <p className="text-[10.5px] font-bold leading-normal">Requiere registrar boleta bancaria o transferencia</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Payment methods list - Col 1 to 7 */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11.5px] font-black uppercase text-slate-400 tracking-wider block">Canales y Formas de Pago</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Bank Transfer details */}
                <div className="bg-slate-50 border rounded-2xl p-4.5 space-y-2.5 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black">BU</div>
                    <span className="font-sans font-black text-xs text-slate-800 uppercase">Transferencia Banco Unión</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 leading-normal font-sans">
                    <li><strong>Titular de la Cuenta:</strong> UAGRM FICCT REC</li>
                    <li><strong>Nro de Cuenta Cte:</strong> 1-00000492102</li>
                    <li><strong>NIT/Documento:</strong> 1020491023 (FICCT)</li>
                    <li><strong>Monto a Transferir:</strong> 700.00 Bs.</li>
                  </ul>
                  <span className="text-[9.5px] text-slate-400 font-bold block pt-1 border-t italic">
                    * Guarde el PDF de transferencia bancaria para el registro inmediato.
                  </span>
                </div>

                {/* Printable QR Code details */}
                <div className="bg-slate-50 border rounded-2xl p-4.5 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-650 text-white flex items-center justify-center text-xs font-black">QR</div>
                      <span className="font-sans font-black text-xs text-slate-800 uppercase">Pago Simple QR Directo</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Escanee el código QR oficial de recaudaciones desde el aplicativo de su banco en su smartphone.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white border p-1 rounded-xl shadow-inner max-w-fit mt-1 self-center md:self-start">
                    {/* Mock QR SVG representation */}
                    <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white relative p-0.5 shrink-0 rounded border">
                      <div className="grid grid-cols-5 gap-0.5 w-full h-full opacity-85">
                        <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                        <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                        <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                        <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                        <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                      </div>
                      <span className="absolute text-[8.5px] font-black bg-blue-600 border px-1 py-0.2 rounded leading-none text-white font-sans uppercase">UAGRM</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 mb-0.5 font-sans">Pago Sencillo CUP 700Bs</p>
                      <button
                        onClick={() => {
                          if (triggerAlert) {
                            triggerAlert('Se ha iniciado la descarga del código QR oficial para el depósito de habilitación académica UAGRM (700.00 Bs).', 'Descarga de Recurso');
                          } else {
                            alert('Descargando imagen QR_UAGRM_CUP_700_FICCT.png');
                          }
                        }}
                        className="cursor-pointer text-[9.5px] font-mono leading-none text-blue-600 hover:underline font-black outline-none flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Descargar QR original
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Offline Ventanillas / Cash */}
              <div className="bg-blue-900/5 border border-blue-500/20 p-4.5 rounded-2xl flex gap-3 text-xs text-slate-750">
                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-blue-900 uppercase">Pago Presencial en Ventanillas Autorizadas</p>
                  <p className="leading-relaxed">
                    Puede presentarse en cualquier ventanilla de cobranzas del <strong>Banco Unión</strong> o <strong>Banco Mercantil Santa Cruz</strong>. Indique que realizará el pago de matrícula para la admisión FICCT - UAGRM, identificándose con su número de Registro Académico: <strong className="font-mono text-slate-900 underline">{user.codigo_registro}</strong> o número de Cédula de Identidad: <strong className="font-mono text-slate-900 underline">{user.ci}</strong>.
                  </p>
                </div>
              </div>

            </div>

            {/* Submission Form / verification request status - Col 8 to 12 */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11.5px] font-black uppercase text-slate-400 tracking-wider block">Verificación de Pago</span>

              {isPaid ? (
                <div className="bg-emerald-50 border border-emerald-250 p-6 rounded-2xl space-y-4">
                  <div className="flex gap-2 text-emerald-800">
                    <FileCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-sans font-black text-xs uppercase tracking-wide leading-tight">SU ARANCEL DE 700 Bs. SE ENCUENTRA ARREGLADO</h4>
                      <p className="text-xs text-emerald-600 mt-1">El Departamento Administrativo de la FICCT expidió su boleta de validación fiscal.</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-4.5 text-xs text-slate-700 space-y-2">
                    <p className="flex justify-between border-b pb-1.5"><span className="text-slate-400 font-bold">Concepto:</span> <strong className="font-black text-slate-900 uppercase">Aporte CUP Admisión</strong></p>
                    <p className="flex justify-between border-b pb-1.5"><span className="text-slate-400 font-bold">Monto Registrado:</span> <strong className="font-sans font-black text-slate-900">700.00 Bs. (Cobrado)</strong></p>
                    <p className="flex justify-between border-b pb-1.5"><span className="text-slate-400 font-bold">Número de Factura:</span> <strong className="font-mono font-black text-slate-900">{currentPay?.nro_factura}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400 font-bold">Fecha de Liquidación:</span> <strong className="font-sans text-slate-900 font-bold">{new Date(currentPay?.fecha_pago || '').toLocaleDateString('es-ES')}</strong></p>
                  </div>

                  <button
                    onClick={() => {
                      const careerName = c1?.nombre || 'Ingeniería';
                      downloadReceiptPDF({
                        username: user.codigo_registro,
                        pass: user.password || user.ci,
                        fullName: user.nombre_completo,
                        ci: user.ci,
                        career: careerName,
                        paymentRef: currentPay?.nro_factura || 'F-2026-9041',
                        paymentMethod: currentPay?.nro_factura?.startsWith('FAC-') ? 'Tarjeta de Crédito/Débito' : 'Depósito Bancario / QR',
                        date: currentPay?.fecha_pago ? new Date(currentPay.fecha_pago).toLocaleString('es-ES') : new Date().toLocaleString('es-ES'),
                        status: 'PAGADO',
                        turno: estudiante?.turno_preferido || 'Mañana'
                      });
                      if (triggerAlert) {
                        triggerAlert(`Se ha generado y descargado exitosamente la Boleta Fiscal en PDF para el postulante: \n\n${user.nombre_completo.toUpperCase()}`, 'Boleta Descargada');
                      }
                    }}
                    className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-sans font-black uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all border border-slate-750 shadow text-center flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-white" />
                    Descargar Comprobante Fiscal (PDF)
                  </button>
                </div>
              ) : isPending ? (
                <div className="bg-amber-50 border border-amber-250 p-6 rounded-2xl space-y-4">
                  <div className="flex gap-2 text-amber-800">
                    <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="font-sans font-black text-xs uppercase tracking-wide leading-tight">BOLETA EN PROCESO DE CONTROL</h4>
                      <p className="text-xs text-amber-650 mt-1">
                        Se ha enviado con éxito su referencia de transferencia para verificación manual. Un administrativo validará el depósito bancario.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-4 text-xs text-slate-700 space-y-2">
                    <p className="flex justify-between border-b pb-1.5"><span className="text-slate-400 font-bold">Vía Referencia:</span> <strong className="font-mono font-bold text-slate-900 text-right truncate max-w-[150px]">{currentPay?.nro_factura}</strong></p>
                    <p className="flex justify-between border-b pb-1.5"><span className="text-slate-400 font-bold">Fecha Envío:</span> <strong className="font-sans text-slate-800">{new Date(currentPay?.created_at || '').toLocaleString('es-ES')}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400 font-bold">Parámetro Monto:</span> <strong className="font-sans font-black text-emerald-600">700.00 Bs.</strong></p>
                  </div>

                  <div className="text-[10.5px] text-slate-500 font-bold block leading-relaxed bg-white/70 p-3 rounded-xl border italic">
                    💡 <strong>Consejo:</strong> Puede solicitar soporte en el bloque administrativo del Campus Universitario (Módulo 236 FICCT) si tiene demoras mayores a las 24 horas hábiles.
                  </div>
                </div>
              ) : (
                /* Standard form to report payment */
                <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl shadow-inner space-y-4">
                  <div>
                    <h4 className="font-sans font-black text-slate-850 text-xs uppercase tracking-tight">Formulario de Control Financiero</h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Si ya realizó la transferencia bancaria o escaneo de QR, complete los detalles de su depósito aquí:
                    </p>
                  </div>

                  <form onSubmit={handlePaySubmit} className="space-y-3.5 text-xs">

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Banco Regulador:</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-white border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans text-slate-905"
                      >
                        <option value="Banco Unión">Banco Unión (Cuenta Fiscal Directa)</option>
                        <option value="Banco Mercantil Santa Cruz">Banco Mercantil Santa Cruz</option>
                        <option value="Banco Nacional de Bolivia">BNB - Pago Simple QR</option>
                        <option value="Transferencia Interbancaria">Otro Banco (Transferencia Ach)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Nro de Transacción / Boleta Bancaria:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: DEP-948123041-SCZ"
                        value={voucherRef}
                        onChange={(e) => setVoucherRef(e.target.value)}
                        className="w-full bg-white border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Adjuntar Comprobante Bancario (Digital / Foto):</label>

                      <div className="border-2 border-dashed border-slate-200.rounded p-4 rounded-xl bg-white text-center hover:bg-slate-100/50 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          id="file-pago-upload"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={() => setSimulatedFileUploaded(true)}
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Upload className="w-5 h-5 text-slate-400" />
                          {simulatedFileUploaded ? (
                            <span className="text-[10px] text-emerald-650 font-black uppercase tracking-wide flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 shrink-0 stroke-[3px]" /> boleta_deposito_700bs.png
                            </span>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-slate-800">Arrastre o seleccione su comprobante en PDF o PNG</span>
                              <span className="text-[9px] text-slate-400">Tamaño máximo recomendado: 5 MB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!voucherRef}
                      className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all border border-blue-500 shadow disabled:bg-slate-300 disabled:border-transparent disabled:text-slate-400 disabled:cursor-not-allowed mt-2"
                    >
                      Solicitar Verificación de Transacción
                    </button>

                  </form>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border-4 border-slate-900 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 relative overflow-hidden text-left text-slate-900">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-605"></div>

        <div className="flex justify-between items-start">
          <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-500">
            Cambiar Contraseña
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowPasswordModal(false);
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordError('');
            }}
            className="text-slate-400 hover:text-slate-650 text-xs font-bold font-sans cursor-pointer focus:outline-none"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
          Ingrese su contraseña actual/antigua y defina su nueva clave de acceso al portal.
        </p>

        {passwordError && (
          <div className="bg-rose-50 border border-rose-250 p-3 rounded-xl text-xs text-rose-700 font-sans flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-sans font-bold leading-normal">{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Contraseña Antigua / Actual:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-white border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Nueva Contraseña:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wide">Confirmar Nueva Contraseña:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all border border-blue-500 shadow mt-2"
          >
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  )
}

    </div >
  );
}
