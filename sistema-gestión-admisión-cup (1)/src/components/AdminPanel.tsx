import React, { useState } from 'react';
import {
  Usuario,
  EstudianteDetalle,
  Pago,
  Grupo,
  Nota,
  Bitacora,
  Carrera,
  Materia,
  DocenteDetalle,
  Rol,
  HistorialAprobado,
  CupoCarrera
} from '../types';
import { LaravelApiClient } from '../lib/laravelApi';
import { 
  Users, 
  Search,
  Plus,
  Filter,
  Check,
  X,
  CreditCard,
  Building,
  Award,
  AlertTriangle,
  ChevronRight,
  Database,
  Printer,
  Trash2,
  Edit2,
  FileCheck,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { getEnforcedAdmissions, calculateStudentGPA } from '../dataStore';

interface AdminPanelProps {
  usuarios: Usuario[];
  estudiantes: EstudianteDetalle[];
  docentes: DocenteDetalle[];
  payments: Pago[];
  grupos: Grupo[];
  grades: Nota[];
  bitacoras: Bitacora[];
  carreras: Carrera[];
  materias: Materia[];
  historialAprobados: HistorialAprobado[];
  periodoActivo: string;
  periodos: string[];
  cuposCarreras: CupoCarrera[];
  notaMinimaAprobacion: number;
  onUpdateAdminSettings: (settings: { periodoActivo?: string; periodos?: string[]; cuposCarreras?: CupoCarrera[]; notaMinimaAprobacion?: number }) => void;
  onUpdateEstudiantesEstado: (updated: EstudianteDetalle[]) => void;
  onUpdateHistorialAprobados: (updated: HistorialAprobado[]) => void;
  onAddStudent: (user: Usuario, detail: EstudianteDetalle) => void;
  onEditStudent: (studentId: string, updatedUser: Partial<Usuario>, updatedDetail: Partial<EstudianteDetalle>) => void;
  onDeleteStudent: (studentId: string) => void;
  onApprovePayment: (pagoId: string) => void;
  onResetDatabase: () => void;
  onResetQuotaSettings?: () => void;
  onLogAction: (action: string, module: string) => void;
  onBatchImport: (newStudents: Array<{ user: Usuario; detail: EstudianteDetalle; payment: Pago }>) => void;
  triggerAlert?: (message: string, title?: string) => void;
  triggerConfirm?: (message: string, onConfirm: () => void, title?: string) => void;
}

export default function AdminPanel({
  usuarios,
  estudiantes,
  docentes,
  payments,
  grupos,
  grades,
  bitacoras,
  carreras,
  materias,
  historialAprobados = [],
  periodoActivo,
  periodos,
  cuposCarreras,
  notaMinimaAprobacion,
  onUpdateAdminSettings,
  onUpdateEstudiantesEstado,
  onUpdateHistorialAprobados,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onApprovePayment,
  onResetDatabase,
  onLogAction,
  onBatchImport,
  triggerAlert,
  triggerConfirm
}: AdminPanelProps) {
  // Navigation active tab
  const [activeSubTab, setActiveSubTab] = useState<'inscritos' | 'grupos' | 'pagos' | 'bitacora' | 'lote' | 'historial' | 'cupos'>('inscritos');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyYear, setHistoryYear] = useState<string>('Todos');
  const [historyQuery, setHistoryQuery] = useState<string>('');
  
  // Real-time bitacora state
  const [liveBitacoras, setLiveBitacoras] = useState<Bitacora[]>(bitacoras);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync prop bitacoras to live state initially
  React.useEffect(() => {
    setLiveBitacoras(bitacoras);
  }, [bitacoras]);

  // Polling for real-time bitacora
  React.useEffect(() => {
    let interval: any;
    
    const fetchLogs = async () => {
      setIsRefreshing(true);
      const logs = await LaravelApiClient.getAuditLogs();
      if (logs && Array.isArray(logs)) {
        setLiveBitacoras(logs);
      }
      setIsRefreshing(false);
    };

    if (activeSubTab === 'bitacora') {
      fetchLogs(); // Initial fetch
      interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSubTab]);

  const [selectedPeriod, setSelectedPeriod] = useState(periodoActivo || '2026/1');
  const [newPeriodInput, setNewPeriodInput] = useState('');
  const [tempMinGrade, setTempMinGrade] = useState(notaMinimaAprobacion || 60);
  const [localQuotas, setLocalQuotas] = useState<Record<number, number>>({});

  React.useEffect(() => {
    const periodQuotas: Record<number, number> = {};
    carreras.forEach(c => {
      const config = cuposCarreras.find(cc => cc.carrera_id === c.id && cc.periodo === selectedPeriod);
      periodQuotas[c.id] = config ? config.cupos : c.cupo_maximo;
    });
    setLocalQuotas(periodQuotas);
  }, [selectedPeriod, cuposCarreras, carreras]);
  
  // Create / Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Form registration fields
  const [formCI, setFormCI] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCelular, setFormCelular] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formColegio, setFormColegio] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formFechaNac, setFormFechaNac] = useState('2007-06-01');
  const [formSexo, setFormSexo] = useState<'Masculino' | 'Femenino'>('Masculino');
  const [formTurno, setFormTurno] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana');
  const [formCarrera1, setFormCarrera1] = useState(1);
  const [formCarrera2, setFormCarrera2] = useState(2);
  const [formTitulo, setFormTitulo] = useState(true);
  const [formOtros, setFormOtros] = useState('CI fotocopia');
  
  // Validation messages state
  const [validationError, setValidationError] = useState('');

  // Enforced career admission results
  const stateSnapshot: any = { 
    usuarios, 
    estudiantes, 
    pagos: payments, 
    notas: grades, 
    carreras, 
    grupos, 
    docentes, 
    asistencias: [], 
    bitacoras: [], 
    materias, 
    historialAprobados,
    periodoActivo,
    periodos,
    cuposCarreras,
    notaMinimaAprobacion
  };
  const admissionResults = getEnforcedAdmissions(stateSnapshot);

  // Auto-calculated fields (as requested in page 4, page 6)
  const totalInscritos = estudiantes.length;
  // According to page 6: CantidadGrupos = CEIL(TotalInscritos / 70)
  const ceilingGroupsCount = Math.ceil(totalInscritos / 70);

  // Count outcomes
  const totalPaid = payments.filter(p => p.estado_pago === 'Pagado').length;
  const totalAprobados = admissionResults.filter(a => a.estado_definitivo === 'Aprobado').length;
  const totalReprobados = admissionResults.filter(a => a.estado_definitivo === 'Reprobado').length;
  const totalSaturados = admissionResults.filter(a => a.estado_definitivo === 'Saturado (Sin Cupo)').length;



  // Handle student register form submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Field-level check
    if (!formCI.trim() || !formNombre.trim() || !formEmail.trim() || !formCelular.trim() || !formFechaNac.trim() || !formSexo) {
      setValidationError('Todos los campos marcados con (*) son obligatorios (Nombre, C.I., Correo, Celular, Fecha de Nacimiento, Sexo).');
      return;
    }

    // Name Validation (letters and spaces only, min 5 chars)
    const nombreRegex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]{5,100}$/;
    if (!nombreRegex.test(formNombre.trim())) {
      setValidationError('El nombre completo debe tener al menos 5 caracteres y contener únicamente letras.');
      return;
    }

    // C.I. Validation (5-12 alphanumeric chars/hyphen)
    const ciRegex = /^[0-9a-zA-Z-]{5,12}$/;
    if (!ciRegex.test(formCI.trim())) {
      setValidationError('El número de C.I. debe tener entre 5 y 12 caracteres (solo números, letras o guión).');
      return;
    }

    // Verify CI unique
    const duplicadoCI = usuarios.find(
      u => u.ci.trim().toLowerCase() === formCI.trim().toLowerCase() && u.id !== editingStudentId
    );
    if (duplicadoCI) {
      setValidationError(`El documento C.I. (${formCI}) ya está ocupado por otro usuario registrado.`);
      return;
    }

    // Email Validation (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setValidationError('Por favor ingrese una dirección de correo electrónico válida.');
      return;
    }

    // Verify Email unique
    const duplicadoEmail = usuarios.find(
      u => u.email.trim().toLowerCase() === formEmail.trim().toLowerCase() && u.id !== editingStudentId
    );
    if (duplicadoEmail) {
      setValidationError(`El Correo Electrónico (${formEmail}) ya está ocupado por otro usuario registrado.`);
      return;
    }

    // Phone number (exactly 8 digits)
    const celularRegex = /^[0-9]{8}$/;
    if (!celularRegex.test(formCelular.trim())) {
      setValidationError('El número de celular debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    // Birth date validation (age between 14 and 60)
    const birthDate = new Date(formFechaNac);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (isNaN(birthDate.getTime()) || age < 14 || age > 60) {
      setValidationError('La fecha de nacimiento es inválida o la edad del postulante debe estar entre 14 y 60 años.');
      return;
    }

    if (editingStudentId) {
      // Editing
      onEditStudent(
        editingStudentId,
        {
          ci: formCI,
          nombre_completo: formNombre,
          email: formEmail
        },
        {
          carrera_opcion_1: formCarrera1,
          carrera_opcion_2: formCarrera2,
          turno_preferido: formTurno,
          colegio_procedencia: formColegio,
          ciudad: formCiudad,
          celular: formCelular,
          direccion: formDireccion,
          fecha_nacimiento: formFechaNac,
          sexo: formSexo,
          titulo_bachiller: formTitulo,
          otros_documentos: formOtros
        }
      );
      onLogAction(
        `Administrador modificó la ficha técnica del postulante: ${formNombre} [CI: ${formCI}]`,
        'MÓDULO ADMISIÓN'
      );
    } else {
      // Create new registries
      const newUserId = `u-est-${Date.now()}`;
      const newRegId = `226040${Math.floor(100 + Math.random() * 900)}`;

      const u: Usuario = {
        id: newUserId,
        codigo_registro: newRegId,
        ci: formCI,
        nombre_completo: formNombre,
        email: formEmail,
        rol: Rol.Estudiante,
        estado: true,
        created_at: new Date().toISOString()
      };

      const d: EstudianteDetalle = {
        usuario_id: newUserId,
        carrera_opcion_1: formCarrera1,
        carrera_opcion_2: formCarrera2,
        turno_preferido: formTurno,
        nro_intentos: 1,
        estado_cup: 'Postulante',
        colegio_procedencia: formColegio || 'Cercado Fiscal',
        ciudad: formCiudad || 'Santa Cruz',
        celular: formCelular,
        direccion: formDireccion || 'Urb. Plan 3000',
        fecha_nacimiento: formFechaNac,
        sexo: formFormatedSexo(formSexo),
        titulo_bachiller: formTitulo,
        otros_documentos: formOtros,
        periodo_cup: periodoActivo
      };

      onAddStudent(u, d);
      onLogAction(
        `Administrador registró nuevo postulante: ${formNombre} [C.I. ${formCI}] asignado a carrera ${carreras.find(c => c.id === formCarrera1)?.nombre}`,
        'MÓDULO ADMISIÓN'
      );
    }

    clearForm();
  };

  // Archive current approved students under Gestión 2026
  const handleArchiveCurrentApproved = () => {
    const currentApproved = admissionResults.filter(a => a.estado_definitivo === 'Aprobado');
    if (currentApproved.length === 0) {
      if (triggerAlert) {
        triggerAlert('No se encontraron postulantes aprobados en la gestión vigente para archivar. Verifique las notas finales de las materias.', 'Archivado de Gestión');
      }
      return;
    }

    const action = () => {
      const yearToArchive = 2026;
      // Filter ones already archived to avoid perfect duplication
      const existingCIs = new Set((historialAprobados || []).map(h => `${h.ano}-${h.ci}`));
      
      const newHistoryEntries: HistorialAprobado[] = [];
      
      currentApproved.forEach(app => {
        const uniqueKey = `${yearToArchive}-${app.ci}`;
        if (!existingCIs.has(uniqueKey)) {
          const studentDet = estudiantes.find(e => e.usuario_id === app.estudiante_id);
          const colReg = studentDet ? studentDet.colegio_procedencia : 'Colegio Fiscal';
          
          newHistoryEntries.push({
            id: `ha-2026-${app.estudiante_id}`,
            ano: yearToArchive,
            nombre_completo: app.nombre_completo,
            ci: app.ci,
            codigo_registro: usuarios.find(u => u.id === app.estudiante_id)?.codigo_registro || '226000000',
            carrera_admitida: app.carrera_nombre_admitida || 'Sin Asignar',
            gpa: Number(app.gpa.toFixed(1)),
            colegio_procedencia: colReg
          });
        }
      });

      if (newHistoryEntries.length === 0) {
        if (triggerAlert) {
          triggerAlert('Todos los postulantes aprobados del 2026 ya han sido archivados previamente en el historial.', 'Archivado de Gestión');
        }
        return;
      }

      const updatedHistory = [...(historialAprobados || []), ...newHistoryEntries];
      onUpdateHistorialAprobados(updatedHistory);
      
      onLogAction(
        `Cierre de Gestión Académica: Se archivaron exitosamente ${newHistoryEntries.length} postulantes aprobados del período 2026.`,
        'ADMIN CONFIG'
      );

      if (triggerAlert) {
        triggerAlert(`Se cerró la gestión académica y se archivaron exitosamente ${newHistoryEntries.length} postulantes aprobados del período 2026 en el registro definitivo.`, 'Período Concluido');
      }
    };

    if (triggerConfirm) {
      triggerConfirm(
        `¿Confirmar Cierre de Gestión Académica?\n\nEsto copiará a los ${currentApproved.length} postulantes que actualmente alcanzaron estado "Aprobado" y los archivará con carácter definitivo para la Gestión 2026.\n\nEsta operación de auditoría quedará registrada en las bitácoras correspondientes de la FICCT.`,
        action,
        'Cerrar Período Académico'
      );
    } else {
      action();
    }
  };

  // Filter historical records
  const filteredHistory = (historialAprobados || []).filter(item => {
    const matchYear = historyYear === 'Todos' || item.ano.toString() === historyYear;
    const matchQuery = !historyQuery.trim() || 
      item.nombre_completo.toLowerCase().includes(historyQuery.toLowerCase()) ||
      item.ci.includes(historyQuery) ||
      item.codigo_registro.includes(historyQuery) ||
      item.carrera_admitida.toLowerCase().includes(historyQuery.toLowerCase()) ||
      item.colegio_procedencia.toLowerCase().includes(historyQuery.toLowerCase());
    return matchYear && matchQuery;
  });

  // Calculate historical indicators
  const historyAdmittedCount = filteredHistory.length;
  
  const topHistoryStudent = filteredHistory.length > 0 
    ? [...filteredHistory].sort((a,b) => b.gpa - a.gpa)[0]
    : null;

  const avgGpaHistory = filteredHistory.length > 0
    ? Number((filteredHistory.reduce((acc, h) => acc + h.gpa, 0) / filteredHistory.length).toFixed(1))
    : 0;

  const careerCounts: Record<string, number> = {};
  filteredHistory.forEach(h => {
    careerCounts[h.carrera_admitida] = (careerCounts[h.carrera_admitida] || 0) + 1;
  });
  let topCareerHistory = 'Ninguna';
  let topCareerHistoryCount = 0;
  Object.entries(careerCounts).forEach(([name, count]) => {
    if (count > topCareerHistoryCount) {
      topCareerHistoryCount = count;
      topCareerHistory = name;
    }
  });

  const formFormatedSexo = (val: string): 'Masculino' | 'Femenino' => {
    return val === 'Femenino' ? 'Femenino' : 'Masculino';
  };

  // Pre-populate editing mode
  const triggerEdit = (stId: string) => {
    const studentDet = estudiantes.find(s => s.usuario_id === stId);
    const studentUser = usuarios.find(u => u.id === stId);
    if (!studentDet || !studentUser) return;

    setEditingStudentId(stId);
    setFormCI(studentUser.ci);
    setFormNombre(studentUser.nombre_completo);
    setFormEmail(studentUser.email);
    setFormCelular(studentDet.celular);
    setFormCiudad(studentDet.ciudad);
    setFormColegio(studentDet.colegio_procedencia);
    setFormDireccion(studentDet.direccion);
    setFormFechaNac(studentDet.fecha_nacimiento);
    setFormSexo(studentDet.sexo);
    setFormTurno(studentDet.turno_preferido);
    setFormCarrera1(studentDet.carrera_opcion_1);
    setFormCarrera2(studentDet.carrera_opcion_2);
    setFormTitulo(studentDet.titulo_bachiller);
    setFormOtros(studentDet.otros_documentos);

    setShowAddModal(true);
  };

  const clearForm = () => {
    setEditingStudentId(null);
    setFormCI('');
    setFormNombre('');
    setFormEmail('');
    setFormCelular('');
    setFormCiudad('');
    setFormColegio('');
    setFormDireccion('');
    setFormFechaNac('2007-06-01');
    setFormSexo('Masculino');
    setFormTurno('Mañana');
    setFormCarrera1(1);
    setFormCarrera2(2);
    setFormTitulo(true);
    setFormOtros('CI fotocopia');
    setValidationError('');
    setShowAddModal(false);
  };

  // Simulate Excel batch file load
  const triggerBatchLoad = () => {
    const batchSeed = [
      {
        user: { id: 'u-batch-1', codigo_registro: '226040501', ci: '9312111', nombre_completo: 'Rodrigo Lanza Saucedo', email: 'rodrigo.saucer@gmail.com', rol: Rol.Estudiante, estado: true, created_at: new Date().toISOString() },
        detail: { usuario_id: 'u-batch-1', carrera_opcion_1: 1, carrera_opcion_2: 4, turno_preferido: 'Mañana' as const, nro_intentos: 1, estado_cup: 'Inscrito' as const, colegio_procedencia: 'U.E. Adventista', ciudad: 'Santa Cruz', celular: '73022144', direccion: 'Barrio Las Palmas', fecha_nacimiento: '2007-04-12', sexo: 'Masculino' as const, titulo_bachiller: true, otros_documentos: 'CI fotocopia', periodo_cup: '2026/1' },
        payment: { id: 'p-b-1', estudiante_id: 'u-batch-1', monto: 700.00, nro_factura: 'F-2026-B01', estado_pago: 'Pagado' as const, fecha_pago: new Date().toISOString(), created_at: new Date().toISOString() }
      },
      {
        user: { id: 'u-batch-2', codigo_registro: '226040502', ci: '8124021', nombre_completo: 'Daniela Rivero Justiniano', email: 'daniela.jus@outlook.com', rol: Rol.Estudiante, estado: true, created_at: new Date().toISOString() },
        detail: { usuario_id: 'u-batch-2', carrera_opcion_1: 2, carrera_opcion_2: 1, turno_preferido: 'Tarde' as const, nro_intentos: 1, estado_cup: 'Inscrito' as const, colegio_procedencia: 'Colegio Josefina', ciudad: 'Montero', celular: '74120330', direccion: 'Av. Circunvalación Nro. 50', fecha_nacimiento: '2008-01-20', sexo: 'Femenino' as const, titulo_bachiller: true, otros_documentos: 'CI fotocopia, Certificado de Nacimiento', periodo_cup: '2026/1' },
        payment: { id: 'p-b-2', estudiante_id: 'u-batch-2', monto: 700.00, nro_factura: 'F-2026-B02', estado_pago: 'Pagado' as const, fecha_pago: new Date().toISOString(), created_at: new Date().toISOString() }
      },
      {
        user: { id: 'u-batch-3', codigo_registro: '226040503', ci: '10921024', nombre_completo: 'Oscar Terrazas Aguilera', email: 'oscar.terra@gmail.com', rol: Rol.Estudiante, estado: true, created_at: new Date().toISOString() },
        detail: { usuario_id: 'u-batch-3', carrera_opcion_1: 3, carrera_opcion_2: 2, turno_preferido: 'Noche' as const, nro_intentos: 1, estado_cup: 'Inscrito' as const, colegio_procedencia: 'U.E. Bolivia', ciudad: 'Naranjal', celular: '60124401', direccion: 'Comunidad Naranjal', fecha_nacimiento: '2007-09-05', sexo: 'Masculino' as const, titulo_bachiller: true, otros_documentos: 'Formulario de Inscripción', periodo_cup: '2026/1' },
        payment: { id: 'p-b-3', estudiante_id: 'u-batch-3', monto: 700.00, nro_factura: 'F-2026-B03', estado_pago: 'Pagado' as const, fecha_pago: new Date().toISOString(), created_at: new Date().toISOString() }
      }
    ];

    onBatchImport(batchSeed);
    onLogAction('Carga en lote de 3 nuevos postulantes procesada mediante simulación de hoja Excel / CSV.', 'SISTEMA CONTROLLER');
    if (triggerAlert) {
      triggerAlert('¡Importación procesada! Se han agregado 3 postulantes premium con notas, asignación de grupo y pago verificado automáticamente.', 'Carga en Lote Exitosa');
    } else {
      alert('¡Importación procesada! Se han agregado 3 postulantes con notas y pago validado.');
    }
  };

  // Searching filter matching CI, full name, or voice commands (aprobados, reprobados)
  const filteredApplicants = admissionResults.filter(adm => {
    const isVoiceAprobado = searchQuery.toLowerCase() === 'aprobados';
    const isVoiceReprobado = searchQuery.toLowerCase() === 'reprobados';

    if (isVoiceAprobado) {
      return adm.estado_definitivo === 'Aprobado' || adm.estado_definitivo === 'Saturado (Sin Cupo)';
    }
    if (isVoiceReprobado) {
      return adm.estado_definitivo === 'Reprobado';
    }

    return (
      adm.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.ci.includes(searchQuery) ||
      adm.carrera_nombre_admitida.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.estado_definitivo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div id="admin-workspace" className="space-y-8">
      
      {/* 4 Indicadores Estadísticos: Total inscritos, Total aprobados, Total reprobados, Total grupos habilitados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md relative overflow-hidden transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Inscritos</p>
              <h3 className="text-4xl font-black text-slate-900 mt-1">{totalInscritos}</h3>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Suscritos FICCT</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
              <Users className="w-5 h-5 stroke-[2.5px]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md relative overflow-hidden transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aprobados</p>
              <h3 className="text-4xl font-black text-emerald-600 mt-1">
                {totalAprobados}
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Promedio &ge; 60 pts</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100">
              <Award className="w-5 h-5 stroke-[2.5px]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md relative overflow-hidden transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Reprobados</p>
              <h3 className="text-4xl font-black text-rose-600 mt-1">
                {totalReprobados + totalSaturados}
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Saturados: {totalSaturados}</p>
            </div>
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100">
              <AlertTriangle className="w-5 h-5 stroke-[2.5px]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md relative overflow-hidden transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Grupos Habilitados</p>
              <h3 className="text-4xl font-black text-indigo-600 mt-1">
                {ceilingGroupsCount}<span className="text-lg text-slate-400 font-normal">/max</span>
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Límite: CEIL(N/70)</p>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100">
              <Building className="w-5 h-5 stroke-[2.5px]" />
            </div>
          </div>
        </div>

      </div>

      {/* Main Admin Sub-Navigation links - Styled with bold tab navigation buttons */}
      <div className="flex flex-wrap gap-2.5 bg-slate-100/50 p-2 rounded-2xl border-2 border-slate-200">
        
        <button
          onClick={() => setActiveSubTab('inscritos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'inscritos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Postulantes ({filteredApplicants.length})
        </button>

        <button
          onClick={() => setActiveSubTab('grupos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'grupos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Planificación Grupos
        </button>

        <button
          onClick={() => setActiveSubTab('pagos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'pagos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Control Facturas (700 Bs.)
        </button>

        <button
          onClick={() => setActiveSubTab('lote')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'lote'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Carga Masiva (Excel)
        </button>

        <button
          onClick={() => setActiveSubTab('bitacora')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'bitacora'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Bitácora Transversal ({bitacoras.length})
        </button>

        <button
          onClick={() => setActiveSubTab('historial')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'historial'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Historial Aprobados ({(historialAprobados || []).length})
        </button>

        <button
          onClick={() => setActiveSubTab('cupos')}
          className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-sans font-black transition-all uppercase tracking-wider shrink-0 ${
            activeSubTab === 'cupos'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/85'
          }`}
        >
          Gestión de Cupos & Admisión
        </button>

      </div>

      {/* SUB-TABS VIEWS */}

      {/* 1. Applicants CRUD view */}
      {activeSubTab === 'inscritos' && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden">
          
          <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por CI, Nombre, Carrera..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-slate-200 text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-slate-800 w-full md:w-[280px]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs font-black text-rose-500 hover:text-rose-700">LIMPIAR</button>
              )}
            </div>

            <div className="flex gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase tracking-wider grow justify-center border border-blue-700 shadow"
              >
                <Plus className="w-4 h-4" />
                Registrar Postulante
              </button>
              
              <button
                onClick={onResetDatabase}
                className="cursor-pointer border-2 border-slate-200 text-slate-700 hover:bg-slate-100/60 text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all"
                title="Reiniciar a semilla inicial"
              >
                Resetear BD
              </button>
            </div>
          </div>

          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left font-sans text-slate-700 border-collapse">
              <thead className="bg-slate-50 border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="py-3.5 px-6">Postulante</th>
                  <th className="py-3.5 px-4">Contacto/Ciudad</th>
                  <th className="py-3.5 px-4">Carreras (1ra / 2da)</th>
                  <th className="py-3.5 px-4 text-center">Promedio</th>
                  <th className="py-3.5 px-4">Admisión / Detalle</th>
                  <th className="py-3.5 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Ningún postulante coincide con los criterios.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map(p => {
                    const studentDet = estudiantes.find(s => s.usuario_id === p.estudiante_id);
                    const billing = payments.find(pay => pay.estudiante_id === p.estudiante_id);
                    const isPaid = billing?.estado_pago === 'Pagado';

                    return (
                      <tr key={p.estudiante_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="block font-bold text-slate-900 leading-snug">{p.nombre_completo}</span>
                          <span className="font-mono text-[10px] text-slate-500">CI: {p.ci} | Reg: {usuarios.find(u => u.id === p.estudiante_id)?.codigo_registro}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="block text-slate-700">{studentDet?.celular}</span>
                          <span className="text-slate-400">{studentDet?.ciudad}</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-sans">
                          <span className="block font-medium text-slate-800">1. {carreras.find(c => c.id === p.carrera_opcion_1_id)?.nombre}</span>
                          <span className="text-slate-500">2. {carreras.find(c => c.id === p.carrera_opcion_2_id)?.nombre}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {p.gpa.toFixed(1)} pts
                        </td>
                        <td className="py-3 px-4">
                          {p.estado_definitivo === 'Aprobado' ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 inline-block">ADMITIDO</span>
                              <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{p.carrera_nombre_admitida}</p>
                            </div>
                          ) : p.estado_definitivo === 'Saturado (Sin Cupo)' ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 inline-block">APROBADO S/CUPO</span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{p.observaciones}</p>
                            </div>
                          ) : p.estado_definitivo === 'Reprobado' ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 inline-block">REPROBADO</span>
                              <p className="text-[10px] text-slate-400 max-w-[160px] truncate">{p.observaciones}</p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 inline-block">POSTULANTE</span>
                              <p className="text-[10px] text-slate-400">{!isPaid ? 'Esperando pago 700Bs.' : 'Esperando título'}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => triggerEdit(p.estudiante_id)}
                              className="cursor-pointer p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Editar Ficha"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStudent(p.estudiante_id)}
                              className="cursor-pointer p-1.5 rounded bg-slate-100 hover:bg-rose-50 text-rose-600 transition"
                              title="Eliminar Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Group allocation details */}
      {activeSubTab === 'grupos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-slate-900 border-b pb-2">Planificación de Capacidad Física</h3>
            
            <div className="text-sm text-slate-600">
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Cálculo Automático de Grupos (Regla FICCT):</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs space-y-1.5">
                  <p className="text-blue-700 font-bold">Cantidad de Grupos = CEIL(TotalInscritos / 70)</p>
                  <p>Inscritos Totales: {totalInscritos}</p>
                  <p className="font-bold text-slate-800 text-sm">Resultado: {ceilingGroupsCount} Grupos Habilitados</p>
                  <p className="text-[10px] text-slate-400 mt-2 italic">* Según directriz institucional: Cada grupo tendrá máximo 70 estudiantes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grupos.map(g => {
              const matchMat = materias.find(m => m.id === g.materia_id);
              const matchDoc = usuarios.find(u => u.id === g.docente_id);
              
              return (
                <div key={g.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{matchMat?.nombre}</span>
                      <h4 className="font-sans font-bold text-slate-800 text-sm mt-0.5">{g.sigla} - Turno {g.turno}</h4>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {g.estudiantes_ids.length} / {g.cupo_maximo} Alumnos
                    </span>
                  </div>

                  <div className="bg-slate-50/50 p-2 rounded text-xs text-slate-500">
                    Docente Asignado: <span className="font-medium text-slate-800">{matchDoc?.nombre_completo || 'Sin Designar'}</span>
                  </div>

                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Integrantes del Aula:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {g.estudiantes_ids.map(estId => {
                        const studentUser = usuarios.find(u => u.id === estId);
                        return (
                          <div key={estId} className="bg-slate-50 p-1.5 rounded border border-slate-100/50 truncate" title={studentUser?.nombre_completo}>
                            {studentUser?.nombre_completo || 'Estudiante'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Billing & payment controls */}
      {activeSubTab === 'pagos' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-sans font-bold text-slate-900 text-sm">Auditoría Financiera de Aranceles (700 Bs.)</h3>
            <p className="text-xs text-slate-500">Verifique los pagos manuales ingresados y apruebe las facturas para habilitar la matrícula del CUP.</p>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Ningún pago registrado.</div>
            ) : (
              payments.map(pay => {
                const estUser = usuarios.find(u => u.id === pay.estudiante_id);
                return (
                  <div key={pay.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">{estUser?.nombre_completo || 'Estudiante'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">ID Estudiante: {pay.estudiante_id} | Ref: {pay.nro_factura || 'Esperando Validación'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">{pay.monto.toFixed(2)} Bs.</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          pay.estado_pago === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pay.estado_pago}
                        </span>
                      </div>

                      {pay.estado_pago !== 'Pagado' ? (
                        <button
                          onClick={() => onApprovePayment(pay.id)}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Aprobar Factura
                        </button>
                      ) : (
                        <span className="p-1.5 text-emerald-600" title="Validado">
                          <Check className="w-5 h-5 font-extrabold" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. Batch Import Excel simulation */}
      {activeSubTab === 'lote' && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-slate-900">Importador de Matrícula en Lotes (Excel / CSV)</h3>
            <p className="text-xs text-slate-500">
              Cargue el listado emitido por la administración de la facultad para crear automáticamente cuentas individuales de postulantes.
            </p>
          </div>

          <div
            onClick={triggerBatchLoad}
            className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 rounded-2xl p-8 flex flex-col justify-center items-center gap-3 transition-colors group"
          >
            <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="text-center font-sans">
              <p className="font-semibold text-slate-700 text-sm">Haga clic aquí para simular importación del reporte excel ("CUP_Inscripcion_Lote.xlsx")</p>
              <p className="text-xs text-slate-400 mt-1">Soporta formatos estándar CSV, XLS generados por Rectorado UAGRM.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 font-sans text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-700 uppercase tracking-wide">Estructura esperada por el software (Columnas obligatorias):</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-slate-500">
              <div className="bg-white p-1.5 rounded text-center">C.I. (ci)</div>
              <div className="bg-white p-1.5 rounded text-center">Nombre Completo</div>
              <div className="bg-white p-1.5 rounded text-center">Email Valido</div>
              <div className="bg-white p-1.5 rounded text-center">Carrera Opción 1 & 2</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Transversal Auditoria Log */}
      {activeSubTab === 'bitacora' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-slate-900 text-sm">Bitácora Transversal de Auditoría de Red (CU8)</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-emerald-600"></div>
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-500 text-left">Registro histórico de procesos y cambios de estado en la base de datos.</p>
            </div>
            <div className="flex items-center gap-3">
              {isRefreshing && <span className="text-[10px] text-slate-400 font-mono italic">Actualizando...</span>}
              <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded">
                {liveBitacoras.length} Líneas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left font-sans text-slate-700">
              <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Usuario Responsable</th>
                  <th className="py-2.5 px-4">Acción Efectuada</th>
                  <th className="py-2.5 px-4 text-center">Módulo</th>
                  <th className="py-2.5 px-4 text-center">IP Conexión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {liveBitacoras.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.created_at).toLocaleString('es-BO')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block text-slate-800 text-left">{log.usuario_nombre || log.usuario?.nombre_completo || 'SISTEMA'}</span>
                      <span className="text-[10px] text-slate-400 block text-left">ID: {log.usuario_id || 'AUTO'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[300px] text-left">
                      {log.accion}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Historical approved applicants view */}
      {activeSubTab === 'historial' && (
        <div id="approved-history-tab" className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl border-2 border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="space-y-1">
                <span className="inline-block text-[9px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono font-bold">
                  FICCT - REGISTRO HISTÓRICO
                </span>
                <h3 className="font-sans font-black text-xl tracking-tight uppercase">
                  Historial Académico de Postulantes Aprobados
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Consulta centralizada de vacantes, promedios de admisión e indicadores estadísticos por gestión académica CUP (UAGRM).
                </p>
              </div>

              {/* Closure button */}
              <button
                onClick={handleArchiveCurrentApproved}
                className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-sans font-black uppercase tracking-wider px-5 py-3 rounded-xl border border-blue-700 shadow-lg transition-all flex items-center gap-2 shrink-0"
              >
                <FileCheck className="w-4 h-4 stroke-[2.5px]" />
                Registrar/Cerrar Gestión 2026
              </button>
            </div>
          </div>

          {/* Quick Filters bar */}
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajustar Año:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 select-none">
                {['Todos', '2024', '2025', '2026'].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setHistoryYear(yr)}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      historyYear === yr
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-250'
                        : 'text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    {yr === 'Todos' ? 'Todos' : `Año ${yr}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por CI, Nombre, Carrera, Colegio..."
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
              />
              {historyQuery && (
                <button onClick={() => setHistoryQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Bento metrics display */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Admitidos Filtrados</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-slate-900">{historyAdmittedCount}</span>
                <span className="text-xs text-slate-400 font-bold uppercase font-mono pl-1">Estudiantes</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Promedio GPA Histórico</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-blue-600 font-mono">{avgGpaHistory}</span>
                <span className="text-xs text-slate-400 font-bold uppercase font-mono pl-1">puntos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md col-span-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Mayor Demanda</span>
              <p className="text-[13px] font-black text-slate-800 mt-2 truncate uppercase tracking-tight">
                {topCareerHistory}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Vacantes asignadas: {topCareerHistoryCount}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md col-span-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Mejor Calificación</span>
              <p className="text-[13px] font-black text-emerald-600 mt-2 truncate uppercase tracking-tight">
                {topHistoryStudent ? topHistoryStudent.nombre_completo : 'N/A'}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                GPA Máximo: <span className="font-black text-slate-800 font-mono">{topHistoryStudent ? topHistoryStudent.gpa : 0} pts</span>
              </span>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden">
            
            <div className="py-4 px-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                Vacantes Consolidadas Anuales
              </span>
              <span className="text-[11px] font-black text-slate-655 font-mono bg-white border-2 border-slate-205 px-3 py-1 rounded-full text-slate-800">
                {filteredHistory.length} registros aprobados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none">
                    <th className="py-3 px-6">Gestión</th>
                    <th className="py-3 px-4">Código Reg.</th>
                    <th className="py-3 px-4">C.I.</th>
                    <th className="py-3 px-6">Postulante Admitido</th>
                    <th className="py-3 px-6">Carrera de Ingreso de la FICCT</th>
                    <th className="py-3 px-4 text-center">GPA Final</th>
                    <th className="py-3 px-6">Colegio Procedencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-sans font-bold uppercase">
                        Ningún registro cargado para los criterios proporcionados o año filtrado.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-sans">
                          <span className="bg-slate-900 border border-slate-800 text-white px-2 py-0.5 rounded font-mono text-[9px] font-black">
                            {item.ano}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] font-bold text-blue-600">
                          {item.codigo_registro}
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-650">
                          {item.ci}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black block text-slate-800 uppercase tracking-tight">{item.nombre_completo}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-705 font-bold">
                          {item.carrera_admitida}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-700 text-[11px] px-2 py-1 rounded">
                            {item.gpa.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-sans">
                          {item.colegio_procedencia}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* 7. Gestión de Cupos and Periodos sub-tab */}
      {activeSubTab === 'cupos' && (
        <div id="cupos-management-tab" className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl border-2 border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="space-y-1">
                <span className="inline-block text-[9px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono font-bold">
                  FICCT - ADMINISTRACIÓN DE VACANTES
                </span>
                <h3 className="font-sans font-black text-xl tracking-tight uppercase">
                  Parámetros de Cupos y Periodos Académicos
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Defina los cupos máximos por carrera para cada período, configure la nota mínima de aprobación y simule el estado de admisión de los postulantes por orden de mérito.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Periodos & Nota Minima */}
            <div className="space-y-6">
              
              {/* Periodos Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Periodos del CUP</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Periodo Activo para Nuevos Registros:</label>
                    <div className="flex gap-2">
                      <select
                        value={periodoActivo}
                        onChange={(e) => {
                          onUpdateAdminSettings({ periodoActivo: e.target.value });
                          onLogAction(`Establece periodo activo a ${e.target.value}`, 'ADMIN');
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none w-full font-bold cursor-pointer"
                      >
                        {periodos.map(p => (
                          <option key={p} value={p}>Periodo {p}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 text-left">
                      Los postulantes nuevos se registrarán automáticamente en este periodo.
                    </span>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Crear Nuevo Periodo Académico:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: 2027/1"
                        value={newPeriodInput}
                        onChange={(e) => setNewPeriodInput(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none w-full font-mono uppercase font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newPeriodInput.trim().toUpperCase();
                          if (!val) return;
                          if (periodos.includes(val)) {
                            triggerAlert?.('El periodo ya existe.', 'Error');
                            return;
                          }
                          const updatedPeriodos = [...periodos, val];
                          
                          // Initialize default quotas for new period
                          const updatedQuotas = [...cuposCarreras];
                          carreras.forEach(c => {
                            updatedQuotas.push({
                              carrera_id: c.id,
                              periodo: val,
                              cupos: c.cupo_maximo
                            });
                          });

                          onUpdateAdminSettings({
                            periodos: updatedPeriodos,
                            cuposCarreras: updatedQuotas
                          });
                          onLogAction(`Crea periodo académico ${val}`, 'ADMIN');
                          setNewPeriodInput('');
                          setSelectedPeriod(val);
                          triggerAlert?.(`Periodo ${val} creado con éxito.`, 'Éxito');
                        }}
                        className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-sans font-black uppercase px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota Minima Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Nota Mínima de Aprobación</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Nota de Corte del CUP:</label>
                      <span className="bg-blue-50 text-blue-700 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {tempMinGrade} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="51"
                      max="100"
                      value={tempMinGrade}
                      onChange={(e) => setTempMinGrade(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>60 pts (Mínimo CUP)</span>
                      <span>100 pts</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateAdminSettings({ notaMinimaAprobacion: tempMinGrade });
                      onLogAction(`Establece nota mínima de aprobación a ${tempMinGrade}`, 'ADMIN');
                      triggerAlert?.(`Nota de corte establecida en ${tempMinGrade} puntos.`, 'Nota Actualizada');
                    }}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-sans font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all w-full text-center"
                  >
                    Guardar Nota de Corte
                  </button>
                </div>
              </div>

            </div>

            {/* Column 2: Cupos Config (Grid span 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md space-y-4">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Configurar Cupos de Carrera</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo a Configurar:</span>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none cursor-pointer"
                    >
                      {periodos.map(p => (
                        <option key={p} value={p}>Periodo {p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {carreras.map(c => {
                    const currentVal = localQuotas[c.id] !== undefined ? localQuotas[c.id] : c.cupo_maximo;
                    return (
                      <div key={c.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="block font-black text-slate-800 uppercase text-[11px] tracking-tight">{c.nombre}</span>
                          <span className="block text-[9px] text-slate-400 font-mono">ID Carrera: {c.id}</span>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setLocalQuotas(prev => ({
                                ...prev,
                                [c.id]: val
                              }));
                            }}
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold font-mono focus:outline-none w-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-slate-405 text-left max-w-sm leading-tight">
                    * Modificar los cupos de Informática, Sistemas, Redes y Computación afectará la simulación de admisión en tiempo real para este periodo.
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      // Update cuposCarreras state
                      const updated = cuposCarreras.filter(cc => cc.periodo !== selectedPeriod);
                      carreras.forEach(c => {
                        const val = localQuotas[c.id] !== undefined ? localQuotas[c.id] : c.cupo_maximo;
                        updated.push({
                          carrera_id: c.id,
                          periodo: selectedPeriod,
                          cupos: val
                        });

                        // Sincronizar con el Backend Real si está disponible
                        if (LaravelApiClient) {
                          LaravelApiClient.updateCareerQuota(c.id, val).catch(() => {
                            console.warn(`Error al sincronizar cupo de ${c.nombre} con el backend.`);
                          });
                        }
                      });

                      onUpdateAdminSettings({ cuposCarreras: updated });
                      onLogAction(`Ajusta cupos para carreras en periodo ${selectedPeriod}`, 'ADMIN');
                      triggerAlert?.(`Cupos de carreras actualizados para el período ${selectedPeriod}.`, 'Configuración Guardada');
                    }}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-sans font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                  >
                    Guardar Límites de Cupos
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Interactive Simulation & Publication View */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden space-y-4 p-5">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-sans font-black text-[13px] text-slate-800 uppercase tracking-tight text-left">
                  Simulación de Admisiones por Mérito Académico ({selectedPeriod})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 text-left">
                  Visualice el estado proyectado de admisión según el promedio de los estudiantes y los cupos definidos anteriormente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerConfirm?.(
                    `¿Está seguro de publicar formalmente las admisiones para el periodo ${selectedPeriod}? Esto modificará de forma permanente el estado CUP de los postulantes de dicho período.`,
                    () => {
                      // Sincronizar con el Backend Real si está disponible
                      if (LaravelApiClient) {
                        LaravelApiClient.triggerOfficialAdmissionsClose().then(resp => {
                          if (resp && resp.success) {
                            console.info('Admisiones cerradas exitosamente en el backend.');
                          }
                        }).catch(() => {
                          console.warn('Error al cerrar admisiones en el backend, procediendo con guardado local.');
                        });
                      }

                      // Get all enforced admissions
                      const results = getEnforcedAdmissions({
                        usuarios,
                        estudiantes,
                        docentes,
                        pagos: payments,
                        grupos,
                        notas: grades,
                        asistencias: [],
                        bitacoras,
                        carreras,
                        materias,
                        historialAprobados,
                        periodoActivo,
                        periodos,
                        cuposCarreras,
                        notaMinimaAprobacion
                      });

                      // Filter results for selected period
                      const updatedEstudiantes = estudiantes.map(est => {
                        if ((est.periodo_cup || '2026/1') === selectedPeriod) {
                          const match = results.find(r => r.estudiante_id === est.usuario_id);
                          if (match) {
                            return {
                              ...est,
                              estado_cup: match.estado_definitivo === 'Aprobado' ? 'Aprobado' as const :
                                          match.estado_definitivo === 'Reprobado' ? 'Reprobado' as const :
                                          match.estado_definitivo === 'Saturado (Sin Cupo)' ? 'Reprobado' as const :
                                          est.estado_cup
                            };
                          }
                        }
                        return est;
                      });

                      onUpdateEstudiantesEstado(updatedEstudiantes);
                      onLogAction(`Publica admisiones oficiales para el período ${selectedPeriod}`, 'ADMIN');
                      triggerAlert?.(`Las admisiones del período ${selectedPeriod} han sido publicadas oficialmente.`, 'Admisiones Publicadas');
                    },
                    'Confirmar Publicación'
                  );
                }}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-sans font-black uppercase tracking-wider px-5 py-3 rounded-xl border border-emerald-700 shadow-md transition-all flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                Publicar Admisiones Oficiales ({selectedPeriod})
              </button>
            </div>

            {/* Metrics cards for simulation */}
            {(() => {
              const simResults = getEnforcedAdmissions({
                usuarios,
                estudiantes,
                docentes,
                pagos: payments,
                grupos,
                notas: grades,
                asistencias: [],
                bitacoras,
                carreras,
                materias,
                historialAprobados,
                periodoActivo,
                periodos,
                cuposCarreras,
                notaMinimaAprobacion
              }).filter(res => {
                const est = estudiantes.find(e => e.usuario_id === res.estudiante_id);
                return (est?.periodo_cup || '2026/1') === selectedPeriod;
              });

              const totalPost = simResults.length;
              const approvedAcad = simResults.filter(r => r.gpa >= notaMinimaAprobacion).length;
              const admitted = simResults.filter(r => r.estado_definitivo === 'Aprobado').length;
              const saturated = simResults.filter(r => r.estado_definitivo === 'Saturado (Sin Cupo)').length;
              const reprobados = simResults.filter(r => r.estado_definitivo === 'Reprobado').length;

              return (
                <div className="space-y-4">
                  
                  {/* Simulation Quick Summary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-left">Total Postulantes</span>
                      <span className="text-xl font-black text-slate-800 block mt-1 text-left">{totalPost}</span>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block text-left">Aprobado Académico</span>
                      <span className="text-xl font-black text-blue-700 block mt-1 text-left">{approvedAcad}</span>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block text-left">Admitidos (Con Cupo)</span>
                      <span className="text-xl font-black text-emerald-700 block mt-1 text-left">{admitted}</span>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block text-left">Saturados (Sin Cupo)</span>
                      <span className="text-xl font-black text-amber-700 block mt-1 text-left">{saturated}</span>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5">
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block text-left">Reprobados</span>
                      <span className="text-xl font-black text-rose-700 block mt-1 text-left">{reprobados}</span>
                    </div>

                  </div>

                  {/* Simulation Student List Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none">
                          <th className="py-2.5 px-4">CI / Código</th>
                          <th className="py-2.5 px-4">Estudiante</th>
                          <th className="py-2.5 px-4">Opciones de Carrera</th>
                          <th className="py-2.5 px-4 text-center">GPA Promedio</th>
                          <th className="py-2.5 px-4">Estado Proyectado</th>
                          <th className="py-2.5 px-4">Detalle / Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {simResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 font-sans font-bold uppercase">
                              Ningún estudiante registrado en el período {selectedPeriod}.
                            </td>
                          </tr>
                        ) : (
                          simResults.map(student => {
                            const opt1 = carreras.find(c => c.id === student.carrera_opcion_1_id)?.nombre || 'Desconocido';
                            const opt2 = carreras.find(c => c.id === student.carrera_opcion_2_id)?.nombre || 'Ninguna';
                            
                            let badgeStyle = 'bg-slate-100 text-slate-600';
                            if (student.estado_definitivo === 'Aprobado') {
                              badgeStyle = 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-black';
                            } else if (student.estado_definitivo === 'Reprobado') {
                              badgeStyle = 'bg-rose-50 border border-rose-200 text-rose-700 font-bold';
                            } else if (student.estado_definitivo === 'Saturado (Sin Cupo)') {
                              badgeStyle = 'bg-amber-50 border border-amber-205 text-amber-700 font-black';
                            } else if (student.estado_definitivo === 'Postulante') {
                              badgeStyle = 'bg-blue-50 border border-blue-200 text-blue-700 font-bold';
                            }

                            return (
                              <tr key={student.estudiante_id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold">
                                  <span className="block text-slate-700">{student.ci}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{student.estudiante_id}</span>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800 uppercase tracking-tight">
                                  {student.nombre_completo}
                                </td>
                                <td className="py-3 px-4 text-[11px] leading-tight">
                                  <span className="block font-black text-slate-700">1ra: {opt1}</span>
                                  <span className="block text-slate-400">2da: {opt2}</span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-black text-[12px]">
                                  <span className={student.gpa >= notaMinimaAprobacion ? 'text-emerald-600' : 'text-slate-500'}>
                                    {student.gpa.toFixed(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2.5 py-1 rounded-lg uppercase font-sans tracking-wide inline-block ${badgeStyle}`}>
                                    {student.estado_definitivo === 'Aprobado' ? `Admitido (${student.carrera_nombre_admitida})` : student.estado_definitivo}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[10px] text-slate-500 leading-snug">
                                  {student.observaciones || 'Listo para procesamiento.'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* Postulant CRUD Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-sans font-bold text-slate-900">
                {editingStudentId ? 'Modificar Postulante Existente' : 'Registrar Nuevo Postulante al CUP'}
              </h3>
              <button onClick={clearForm} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-sm">
              
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-sans">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">C.I. * (Carnet de Identidad):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 9314055"
                    value={formCI}
                    onChange={(e) => setFormCI(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombres y Apellidos *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Gabriela Rivero"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *:</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej: gabriela@uagrm.bo"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Celular / Teléfono *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 78011220"
                    value={formCelular}
                    onChange={(e) => setFormCelular(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad:</label>
                  <input
                    type="text"
                    placeholder="Santa Cruz"
                    value={formCiudad}
                    onChange={(e) => setFormCiudad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Colegio de Procedencia:</label>
                  <input
                    type="text"
                    placeholder="Colegio Alemán"
                    value={formColegio}
                    onChange={(e) => setFormColegio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sexo:</label>
                  <select
                    value={formSexo}
                    onChange={(e) => setFormSexo(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Domicilio:</label>
                <input
                  type="text"
                  placeholder="Calle Murillo Nro. 24"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1ra Opción Carrera:</label>
                  <select
                    value={formCarrera1}
                    onChange={(e) => setFormCarrera1(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {carreras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (Cupo: {c.cupo_maximo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2da Opción Carrera (Regla Cupos):</label>
                  <select
                    value={formCarrera2}
                    onChange={(e) => setFormCarrera2(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {carreras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turno Preferido:</label>
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    required
                    value={formFechaNac}
                    onChange={(e) => setFormFechaNac(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="docCheck"
                    checked={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                  />
                  <label htmlFor="docCheck" className="text-xs font-bold text-slate-700">Título de Bachiller</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Otros Documentos Presentados:</label>
                <input
                  type="text"
                  placeholder="CI Fotocopia, Certificado de Nacimiento"
                  value={formOtros}
                  onChange={(e) => setFormOtros(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs pt-3">
                <button
                  type="button"
                  onClick={clearForm}
                  className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-sans transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-slate-905 text-white hover:bg-slate-800 font-bold py-2 px-4 rounded-lg font-sans transition"
                >
                  {editingStudentId ? 'Guardar Cambios' : 'Completar Registro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
