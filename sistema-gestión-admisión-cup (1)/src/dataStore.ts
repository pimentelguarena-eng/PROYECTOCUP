import { Carrera, Materia, Usuario, EstudianteDetalle, DocenteDetalle, Pago, Grupo, Asistencia, Nota, Bitacora, Rol, HistorialAprobado } from './types';
import {
  CARRERAS_INICIALES,
  MATERIAS_INICIALES,
  USUARIOS_INICIALES,
  ESTUDIANTES_INICIALES,
  DOCENTES_INICIALES,
  PAGOS_INICIALES,
  GRUPOS_INICIALES,
  NOTAS_INICIALES,
  ASISTENCIAS_INICIALES,
  BITACORAS_INICIALES,
  HISTORIAL_APROBADOS_INICIALES
} from './initialData';

// Storage Keys
const KEYS = {
  USUARIOS: 'cup_users',
  ESTUDIANTES: 'cup_students',
  DOCENTES: 'cup_teachers',
  PAGOS: 'cup_payments',
  GRUPOS: 'cup_groups',
  NOTAS: 'cup_grades',
  ASISTENCIAS: 'cup_attendances',
  BITACORAS: 'cup_logs',
  CARRERAS: 'cup_careers',
  HISTORIAL_APROBADOS: 'cup_approved_history'
};

export interface DatabaseState {
  usuarios: Usuario[];
  estudiantes: EstudianteDetalle[];
  docentes: DocenteDetalle[];
  pagos: Pago[];
  grupos: Grupo[];
  notas: Nota[];
  asistencias: Asistencia[];
  bitacoras: Bitacora[];
  carreras: Carrera[];
  materias: Materia[];
  historialAprobados: HistorialAprobado[];
}

export function loadDatabase(): DatabaseState {
  try {
    let usuarios = localStorage.getItem(KEYS.USUARIOS) ? JSON.parse(localStorage.getItem(KEYS.USUARIOS)!) : USUARIOS_INICIALES;
    
    // Automatically migrate old cached administrator to new credentials if found
    if (Array.isArray(usuarios)) {
      const adminIndex = usuarios.findIndex(u => u.id === 'u-1');
      if (adminIndex !== -1 && (usuarios[adminIndex].nombre_completo === 'MSc. Ing. Angélica Garzón' || !usuarios[adminIndex].password)) {
        usuarios[adminIndex].nombre_completo = 'Carlos Andres Pimentel Garena';
        usuarios[adminIndex].email = 'carlos.pimentel@uagrm.edu.bo';
        usuarios[adminIndex].password = '61517085';
        try {
          localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
        } catch (e) {
          console.error(e);
        }
      }
    }

    const estudiantes = localStorage.getItem(KEYS.ESTUDIANTES) ? JSON.parse(localStorage.getItem(KEYS.ESTUDIANTES)!) : ESTUDIANTES_INICIALES;
    const docentes = localStorage.getItem(KEYS.DOCENTES) ? JSON.parse(localStorage.getItem(KEYS.DOCENTES)!) : DOCENTES_INICIALES;
    const pagos = localStorage.getItem(KEYS.PAGOS) ? JSON.parse(localStorage.getItem(KEYS.PAGOS)!) : PAGOS_INICIALES;
    const grupos = localStorage.getItem(KEYS.GRUPOS) ? JSON.parse(localStorage.getItem(KEYS.GRUPOS)!) : GRUPOS_INICIALES;
    const notas = localStorage.getItem(KEYS.NOTAS) ? JSON.parse(localStorage.getItem(KEYS.NOTAS)!) : NOTAS_INICIALES;
    const asistencias = localStorage.getItem(KEYS.ASISTENCIAS) ? JSON.parse(localStorage.getItem(KEYS.ASISTENCIAS)!) : ASISTENCIAS_INICIALES;
    const bitacoras = localStorage.getItem(KEYS.BITACORAS) ? JSON.parse(localStorage.getItem(KEYS.BITACORAS)!) : BITACORAS_INICIALES;
    const carreras = localStorage.getItem(KEYS.CARRERAS) ? JSON.parse(localStorage.getItem(KEYS.CARRERAS)!) : CARRERAS_INICIALES;
    const historialAprobados = localStorage.getItem(KEYS.HISTORIAL_APROBADOS) ? JSON.parse(localStorage.getItem(KEYS.HISTORIAL_APROBADOS)!) : HISTORIAL_APROBADOS_INICIALES;

    return {
      usuarios,
      estudiantes,
      docentes,
      pagos,
      grupos,
      notas,
      asistencias,
      bitacoras,
      carreras,
      materias: MATERIAS_INICIALES,
      historialAprobados
    };
  } catch (error) {
    console.error('Error loading database, resetting to defaults:', error);
    return {
      usuarios: USUARIOS_INICIALES,
      estudiantes: ESTUDIANTES_INICIALES,
      docentes: DOCENTES_INICIALES,
      pagos: PAGOS_INICIALES,
      grupos: GRUPOS_INICIALES,
      notas: NOTAS_INICIALES,
      asistencias: ASISTENCIAS_INICIALES,
      bitacoras: BITACORAS_INICIALES,
      carreras: CARRERAS_INICIALES,
      materias: MATERIAS_INICIALES,
      historialAprobados: HISTORIAL_APROBADOS_INICIALES
    };
  }
}

export function saveDatabase(state: DatabaseState) {
  try {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(state.usuarios));
    localStorage.setItem(KEYS.ESTUDIANTES, JSON.stringify(state.estudiantes));
    localStorage.setItem(KEYS.DOCENTES, JSON.stringify(state.docentes));
    localStorage.setItem(KEYS.PAGOS, JSON.stringify(state.pagos));
    localStorage.setItem(KEYS.GRUPOS, JSON.stringify(state.grupos));
    localStorage.setItem(KEYS.NOTAS, JSON.stringify(state.notas));
    localStorage.setItem(KEYS.ASISTENCIAS, JSON.stringify(state.asistencias));
    localStorage.setItem(KEYS.BITACORAS, JSON.stringify(state.bitacoras));
    localStorage.setItem(KEYS.CARRERAS, JSON.stringify(state.carreras));
    localStorage.setItem(KEYS.HISTORIAL_APROBADOS, JSON.stringify(state.historialAprobados || []));
  } catch (error) {
    console.error('Error saving database state:', error);
  }
}

// Global score calculations helper
export function calculateStudentGPA(estudianteId: string, notas: Nota[]): number {
  const studentNotas = notas.filter(n => n.estudiante_id === estudianteId);
  if (studentNotas.length === 0) return 0;
  
  // Calculate average of the graded subjects
  const sum = studentNotas.reduce((acc, n) => {
    // Formula for final subject matter grade is derived from the average of the 3 exams:
    const subjectAverage = (n.nota_parcial_1 + n.nota_parcial_2 + n.nota_examen_final) / 3;
    return acc + subjectAverage;
  }, 0);
  
  // Let's divide by total core subjects (there are 4 standard subjects: Computing, Math, English, Physics)
  // Even if they are not fully tested yet, let's assume average of available graded subjects, or divide by 4.
  // Averaging available graded subjects is more intuitive for current status tracking!
  return sum / studentNotas.length;
}

// Complex Career admission assignments considering limits & dual choices
export interface AdmissionAssignmentResult {
  estudiante_id: string;
  nombre_completo: string;
  ci: string;
  gpa: number;
  carrera_id_admitida: number | null; // null if Reprobado or no cupo left at all
  carrera_nombre_admitida: string;
  carrera_opcion_1_id: number;
  carrera_opcion_2_id: number;
  observaciones: string;
  estado_definitivo: 'Aprobado' | 'Reprobado' | 'Postulante' | 'Saturado (Sin Cupo)';
}

export function processCareerAdmissions(state: DatabaseState): AdmissionAssignmentResult[] {
  const { usuarios, estudiantes, notas, carreras, pagos } = state;
  
  // Get all registered students
  return estudiantes.map(st => {
    const user = usuarios.find(u => u.id === st.usuario_id);
    const billing = pagos.find(p => p.estudiante_id === st.usuario_id);
    const fullName = user?.nombre_completo || 'Desconocido';
    const docId = user?.ci || '';
    
    // Check if they are still pending payment setup
    const hasPaid = billing?.estado_pago === 'Pagado';
    
    // Calculate overall average
    const gpa = calculateStudentGPA(st.usuario_id, notas);
    
    let estado_definitivo: AdmissionAssignmentResult['estado_definitivo'] = 'Postulante';
    let carrera_id_admitida: number | null = null;
    let carrera_nombre_admitida = 'Ninguna';
    let observaciones = '';

    // Step 1: Check document requirements (Titulo bachiller represents core rule "Titulo Bachiller u otros")
    const meetsDocs = st.titulo_bachiller;

    if (!hasPaid) {
      estado_definitivo = 'Postulante';
      observaciones = 'Pago de 700 Bs. pendiente o bajo revisión de boleta.';
    } else if (!meetsDocs) {
      estado_definitivo = 'Postulante';
      observaciones = 'Requisito obligatorio faltante: Título de Bachiller.';
    } else {
      // Checked if GPA >= 60
      if (gpa >= 60) {
        estado_definitivo = 'Aprobado';
      } else {
        estado_definitivo = 'Reprobado';
        observaciones = `Promedio de ${gpa.toFixed(1)} es menor al mínimo de 60 puntos.`;
      }
    }

    return {
      estudiante_id: st.usuario_id,
      nombre_completo: fullName,
      ci: docId,
      gpa,
      carrera_id_admitida,
      carrera_nombre_admitida,
      carrera_opcion_1_id: st.carrera_opcion_1,
      carrera_opcion_2_id: st.carrera_opcion_2,
      observaciones,
      estado_definitivo
    };
  });
}

/**
 * Extends the basic process to strictly enforce career quotas in priority order of performance
 */
export function getEnforcedAdmissions(state: DatabaseState): AdmissionAssignmentResult[] {
  const baseAdmissions = processCareerAdmissions(state);
  const { carreras } = state;
  
  // Create quota trackers
  const quotaCounts: Record<number, number> = {};
  carreras.forEach(c => {
    quotaCounts[c.id] = 0;
  });

  // Separate Approved vs others
  const approvedStudents = baseAdmissions.filter(a => a.estado_definitivo === 'Aprobado');
  const otherStudents = baseAdmissions.filter(a => a.estado_definitivo !== 'Aprobado');

  // Sort approved students by GPA descending (best scores get quota first!)
  approvedStudents.sort((a, b) => b.gpa - a.gpa);

  const finalApproved: AdmissionAssignmentResult[] = approvedStudents.map(student => {
    const op1 = student.carrera_opcion_1_id;
    const op2 = student.carrera_opcion_2_id;
    const op1Career = carreras.find(c => c.id === op1);
    const op2Career = carreras.find(c => c.id === op2);

    let assignedId: number | null = null;
    let assignedName = 'Ninguna';
    let status = student.estado_definitivo;
    let obs = '';

    // Try option 1
    if (op1Career && quotaCounts[op1] < op1Career.cupo_maximo) {
      assignedId = op1;
      assignedName = op1Career.nombre;
      quotaCounts[op1]++;
      obs = `Admitido en su 1ra opción (${op1Career.nombre}).`;
    } 
    // Try Option 2
    else if (op2Career && quotaCounts[op2] < op2Career.cupo_maximo) {
      assignedId = op2;
      assignedName = op2Career.nombre;
      quotaCounts[op2]++;
      obs = `1ra Opción saturada. Admitido en su 2da opción (${op2Career.nombre}) por regla de negocio de cupos.`;
    } 
    // Out of space in both
    else {
      status = 'Saturado (Sin Cupo)';
      obs = `Aprobado academicamente (Nota ${student.gpa.toFixed(1)}), pero ambas opciones están sin vacantes disponibles.`;
    }

    return {
      ...student,
      carrera_id_admitida: assignedId,
      carrera_nombre_admitida: assignedName,
      estado_definitivo: status,
      observaciones: obs
    };
  });

  // Combine and return in original/id order to prevent row jumping in tables
  const combined = [...finalApproved, ...otherStudents];
  return combined;
}

// Function to add a bitacora log entry
export function logAction(
  state: DatabaseState,
  usuarioId: string | null,
  usuarioNombre: string,
  accion: string,
  modulo: string
): DatabaseState {
  const newLog: Bitacora = {
    id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    usuario_id: usuarioId,
    usuario_nombre: usuarioNombre,
    accion,
    modulo,
    ip_address: '190.181.240.100', // Simulated local network
    created_at: new Date().toISOString()
  };

  const updatedLogs = [newLog, ...state.bitacoras].slice(0, 50); // Keep max 50 for clean storage
  return {
    ...state,
    bitacoras: updatedLogs
  };
}
