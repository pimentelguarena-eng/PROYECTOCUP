export enum Rol {
  Administrador = 'Administrador',
  Docente = 'Docente',
  Estudiante = 'Estudiante',
}

export interface Usuario {
  id: string; // BIGSERIAL
  codigo_registro: string;
  ci: string;
  nombre_completo: string;
  email: string;
  password?: string;
  rol: Rol;
  estado: boolean; // Active/Inactive
  created_at: string;
}

export interface Bitacora {
  id: string;
  usuario_id: string | null;
  usuario_nombre?: string;
  accion: string;
  modulo: string;
  ip_address: string;
  created_at: string;
  usuario?: Usuario;
}

export interface Carrera {
  id: number;
  nombre: string;
  cupo_maximo: number; // For the cupo validation rule
}

export interface EstudianteDetalle {
  usuario_id: string;
  carrera_opcion_1: number; // Carrera ID
  carrera_opcion_2: number; // Carrera ID
  turno_preferido: 'Mañana' | 'Tarde' | 'Noche';
  nro_intentos: number;
  estado_cup: 'Postulante' | 'Inscrito' | 'Aprobado' | 'Reprobado';
  colegio_procedencia: string;
  ciudad: string;
  celular: string;
  direccion: string;
  fecha_nacimiento: string;
  sexo: 'Femenino' | 'Masculino';
  titulo_bachiller: boolean;
  otros_documentos: string;
  periodo_cup: string; // e.g. '2026/1'
}

export interface CupoCarrera {
  carrera_id: number;
  periodo: string;
  cupos: number;
}

export interface DocenteDetalle {
  usuario_id: string;
  especialidad: string;
  es_profesional: boolean;
  tiene_maestria: boolean;
  tiene_diplomado: boolean;
  grupos_asignados: string[]; // Group IDs
}

export interface Pago {
  id: string;
  estudiante_id: string;
  monto: number; // Strictly 700.00
  nro_factura: string;
  estado_pago: 'Pendiente' | 'Pagado';
  fecha_pago?: string;
  comprobante_url?: string; // Visual representation of payment receipt upload
  created_at: string;
}

export interface Materia {
  id: number;
  nombre: 'Computación' | 'Matemáticas' | 'Inglés' | 'Física';
}

export interface Grupo {
  id: string;
  sigla: string; // e.g., 'Grupo 21', 'G1'
  materia_id: number;
  docente_id: string | null; // Docente user_id
  turno: 'Mañana' | 'Tarde' | 'Noche';
  modulo: string; // e.g., '227', '236'
  aula: string; // e.g., '10' to '40'
  hora_inicio: string; // e.g., '07:00'
  hora_fin: string; // e.g., '08:00'
  cupo_maximo: number; // Max 70 or 80
  estudiantes_ids: string[]; // References estudiantes (usuario_id)
}

export interface Asistencia {
  id: string;
  estudiante_id: string;
  grupo_id: string;
  fecha: string;
  estado: 'Presente' | 'Falta';
}

export interface Nota {
  id: string;
  estudiante_id: string;
  materia_id: number;
  nota_parcial_1: number; // Examen 1: Correct questions count (0 to 10)
  nota_parcial_2: number; // Examen 2: Correct questions count (0 to 10)
  nota_examen_final: number; // Examen 3: Correct questions count (0 to 10)
  nota_final_materia: number; // Final subject grade scaled to 100 points
}

export interface HistorialAprobado {
  id: string;
  ano: number;
  nombre_completo: string;
  ci: string;
  codigo_registro: string;
  carrera_admitida: string;
  gpa: number;
  colegio_procedencia: string;
}

