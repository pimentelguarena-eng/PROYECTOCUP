import { Carrera, Materia, Usuario, EstudianteDetalle, DocenteDetalle, Pago, Grupo, Asistencia, Nota, Bitacora, Rol, HistorialAprobado, CupoCarrera } from './types';
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
  HISTORIAL_APROBADOS: 'cup_approved_history',
  PERIODO_ACTIVO: 'cup_active_period',
  PERIODOS: 'cup_periods',
  CUPOS_CARRERAS: 'cup_careers_quotas',
  NOTA_MINIMA: 'cup_min_grade'
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
  periodoActivo: string;
  periodos: string[];
  cuposCarreras: CupoCarrera[];
  notaMinimaAprobacion: number;
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
    let grupos = localStorage.getItem(KEYS.GRUPOS) ? JSON.parse(localStorage.getItem(KEYS.GRUPOS)!) : GRUPOS_INICIALES;
    
    // Data Healing: Ensure groups have schedules and locations (Fix for legacy 00:00 or missing fields)
    if (Array.isArray(grupos)) {
      const slots = {
        'Mañana': ['07:00', '08:00', '09:00', '10:00'],
        'Tarde': ['13:00', '14:00', '15:00', '16:00'],
        'Noche': ['18:00', '19:00', '20:00', '21:00'],
      };
      const subjectLocations: Record<number, { mod: string, aula: string }> = {
        1: { mod: '236', aula: '12' },
        2: { mod: '225', aula: '17' },
        3: { mod: '227', aula: '24' },
        4: { mod: '228', aula: '31' }
      };

      grupos = grupos.map(g => {
        const loc = subjectLocations[g.materia_id] || { mod: '236', aula: '10' };
        const hIn = (slots[g.turno as 'Mañana']?.[(g.materia_id - 1) % 4] || '07:00');
        const hOut = `${(parseInt(hIn.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
        
        return {
          ...g,
          modulo: loc.mod,
          aula: loc.aula,
          hora_inicio: hIn,
          hora_fin: hOut
        };
      });
      // Force save healed groups
      localStorage.setItem(KEYS.GRUPOS, JSON.stringify(grupos));
    }
    
    let notas = localStorage.getItem(KEYS.NOTAS) ? JSON.parse(localStorage.getItem(KEYS.NOTAS)!) : NOTAS_INICIALES;
    if (Array.isArray(notas)) {
      let migrated = false;
      notas = notas.map(n => {
        if (n.nota_parcial_1 > 10 || n.nota_parcial_2 > 10 || n.nota_examen_final > 10) {
          migrated = true;
          const p1 = n.nota_parcial_1 > 10 ? n.nota_parcial_1 / 10 : n.nota_parcial_1;
          const p2 = n.nota_parcial_2 > 10 ? n.nota_parcial_2 / 10 : n.nota_parcial_2;
          const ef = n.nota_examen_final > 10 ? n.nota_examen_final / 10 : n.nota_examen_final;
          const matterAvg = parseFloat((((p1 + p2 + ef) / 3) * 10).toFixed(2));
          return {
            ...n,
            nota_parcial_1: p1,
            nota_parcial_2: p2,
            nota_examen_final: ef,
            nota_final_materia: matterAvg
          };
        }
        return n;
      });
      if (migrated) {
        localStorage.setItem(KEYS.NOTAS, JSON.stringify(notas));
      }
    }

    const asistencias = localStorage.getItem(KEYS.ASISTENCIAS) ? JSON.parse(localStorage.getItem(KEYS.ASISTENCIAS)!) : ASISTENCIAS_INICIALES;
    const bitacoras = localStorage.getItem(KEYS.BITACORAS) ? JSON.parse(localStorage.getItem(KEYS.BITACORAS)!) : BITACORAS_INICIALES;
    const carreras = localStorage.getItem(KEYS.CARRERAS) ? JSON.parse(localStorage.getItem(KEYS.CARRERAS)!) : CARRERAS_INICIALES;
    const historialAprobados = localStorage.getItem(KEYS.HISTORIAL_APROBADOS) ? JSON.parse(localStorage.getItem(KEYS.HISTORIAL_APROBADOS)!) : HISTORIAL_APROBADOS_INICIALES;

    const periodoActivo = localStorage.getItem(KEYS.PERIODO_ACTIVO) || '2026/1';
    const periodos = localStorage.getItem(KEYS.PERIODOS) ? JSON.parse(localStorage.getItem(KEYS.PERIODOS)!) : ['2026/1', '2026/2'];
    const notaMinimaAprobacion = localStorage.getItem(KEYS.NOTA_MINIMA) ? Number(localStorage.getItem(KEYS.NOTA_MINIMA)!) : 60;

    const defaultCuposCarreras: CupoCarrera[] = [];
    ['2026/1', '2026/2'].forEach(p => {
      CARRERAS_INICIALES.forEach(c => {
        defaultCuposCarreras.push({
          carrera_id: c.id,
          periodo: p,
          cupos: c.cupo_maximo
        });
      });
    });
    const cuposCarreras = localStorage.getItem(KEYS.CUPOS_CARRERAS) ? JSON.parse(localStorage.getItem(KEYS.CUPOS_CARRERAS)!) : defaultCuposCarreras;

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
      historialAprobados,
      periodoActivo,
      periodos,
      cuposCarreras,
      notaMinimaAprobacion
    };
  } catch (error) {
    console.error('Error loading database, resetting to defaults:', error);
    const defaultCuposCarreras: CupoCarrera[] = [];
    ['2026/1', '2026/2'].forEach(p => {
      CARRERAS_INICIALES.forEach(c => {
        defaultCuposCarreras.push({
          carrera_id: c.id,
          periodo: p,
          cupos: c.cupo_maximo
        });
      });
    });

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
      historialAprobados: HISTORIAL_APROBADOS_INICIALES,
      periodoActivo: '2026/1',
      periodos: ['2026/1', '2026/2'],
      cuposCarreras: defaultCuposCarreras,
      notaMinimaAprobacion: 60
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
    localStorage.setItem(KEYS.PERIODO_ACTIVO, state.periodoActivo);
    localStorage.setItem(KEYS.PERIODOS, JSON.stringify(state.periodos));
    localStorage.setItem(KEYS.CUPOS_CARRERAS, JSON.stringify(state.cuposCarreras));
    localStorage.setItem(KEYS.NOTA_MINIMA, state.notaMinimaAprobacion.toString());
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
    // Scale the correct questions average (0-10) to 100 points by multiplying by 10
    const subjectAverage = ((n.nota_parcial_1 + n.nota_parcial_2 + n.nota_examen_final) / 3) * 10;
    return acc + subjectAverage;
  }, 0);
  
  // Average of available graded subjects
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
  const { usuarios, estudiantes, notas, carreras, pagos, notaMinimaAprobacion } = state;
  const minGrade = notaMinimaAprobacion ?? 60;
  
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
      // Checked if GPA >= minGrade
      if (gpa >= minGrade) {
        estado_definitivo = 'Aprobado';
      } else {
        estado_definitivo = 'Reprobado';
        observaciones = `Promedio de ${gpa.toFixed(1)} es menor al mínimo de ${minGrade} puntos.`;
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
  const { carreras, cuposCarreras } = state;
  
  // Create quota trackers per period per career: Record<string, Record<number, number>>
  const quotaCounts: Record<string, Record<number, number>> = {};
  
  // Get all unique periods in the students list
  const studentPeriods = Array.from(new Set(state.estudiantes.map(e => e.periodo_cup || '2026/1')));
  
  const allResults: AdmissionAssignmentResult[] = [];
  
  studentPeriods.forEach(pId => {
    quotaCounts[pId] = {};
    carreras.forEach(c => {
      quotaCounts[pId][c.id] = 0;
    });
    
    // Get students for this period
    const periodAdmissions = baseAdmissions.filter(adm => {
      const est = state.estudiantes.find(e => e.usuario_id === adm.estudiante_id);
      return (est?.periodo_cup || '2026/1') === pId;
    });
    
    // Separate Approved vs others
    const approvedStudents = periodAdmissions.filter(a => a.estado_definitivo === 'Aprobado');
    const otherStudents = periodAdmissions.filter(a => a.estado_definitivo !== 'Aprobado');
    
    // Sort approved students by GPA descending (best scores get quota first!)
    approvedStudents.sort((a, b) => b.gpa - a.gpa);
    
    const finalApproved = approvedStudents.map(student => {
      const op1 = student.carrera_opcion_1_id;
      const op2 = student.carrera_opcion_2_id;
      const op1Career = carreras.find(c => c.id === op1);
      const op2Career = carreras.find(c => c.id === op2);
      
      const getQuotaLimit = (careerId: number) => {
        if (cuposCarreras) {
          const config = cuposCarreras.find(cc => cc.carrera_id === careerId && cc.periodo === pId);
          if (config) return config.cupos;
        }
        return op1Career?.cupo_maximo ?? 0;
      };
      
      const op1Limit = getQuotaLimit(op1);
      const op2Limit = op2Career ? getQuotaLimit(op2) : 0;
      
      let assignedId: number | null = null;
      let assignedName = 'Ninguna';
      let status = student.estado_definitivo;
      let obs = '';
      
      // Try option 1
      if (op1Career && quotaCounts[pId][op1] < op1Limit) {
        assignedId = op1;
        assignedName = op1Career.nombre;
        quotaCounts[pId][op1]++;
        obs = `Admitido en su 1ra opción (${op1Career.nombre}).`;
      } 
      // Try Option 2
      else if (op2Career && quotaCounts[pId][op2] < op2Limit) {
        assignedId = op2;
        assignedName = op2Career.nombre;
        quotaCounts[pId][op2]++;
        obs = `1ra Opción saturada. Admitido en su 2da opción (${op2Career.nombre}) por regla de negocio de cupos.`;
      } 
      // Out of space in both
      else {
        status = 'Saturado (Sin Cupo)';
        obs = `Aprobado academicamente (Nota ${student.gpa.toFixed(1)}), pero ambas opciones están sin vacantes disponibles para el período ${pId}.`;
      }
      
      return {
        ...student,
        carrera_id_admitida: assignedId,
        carrera_nombre_admitida: assignedName,
        estado_definitivo: status,
        observaciones: obs
      };
    });
    
    allResults.push(...finalApproved, ...otherStudents);
  });
  
  return allResults;
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
