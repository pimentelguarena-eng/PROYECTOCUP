import { Carrera, Materia, Usuario, EstudianteDetalle, DocenteDetalle, Pago, Grupo, Asistencia, Nota, Bitacora, Rol, HistorialAprobado } from './types';

export const CARRERAS_INICIALES: Carrera[] = [
  { id: 1, nombre: 'Ingeniería Informática', cupo_maximo: 5 },
  { id: 2, nombre: 'Ingeniería en Sistemas', cupo_maximo: 4 },
  { id: 3, nombre: 'Ingeniería Redes y Telecomunicaciones', cupo_maximo: 6 },
  { id: 4, nombre: 'Robótica', cupo_maximo: 3 },
];

export const MATERIAS_INICIALES: Materia[] = [
  { id: 1, nombre: 'Computación' },
  { id: 2, nombre: 'Matemáticas' },
  { id: 3, nombre: 'Inglés' },
  { id: 4, nombre: 'Física' },
];

// Seed basic users
export const USUARIOS_INICIALES: Usuario[] = [
  // Admin
  {
    id: 'u-1',
    codigo_registro: '220000001',
    ci: '8877665',
    nombre_completo: 'Carlos Andres Pimentel Garena',
    email: 'carlos.pimentel@uagrm.edu.bo',
    password: '61517085',
    rol: Rol.Administrador,
    estado: true,
    created_at: '2026-05-10T10:00:00Z',
  },
  // Docentes
  {
    id: 'u-doc-1',
    codigo_registro: '150002101',
    ci: '4922011',
    nombre_completo: 'Dr. Alberto Valenzuela',
    email: 'alberto.valenzuela@uagrm.edu.bo',
    password: 'docente123',
    rol: Rol.Docente,
    estado: true,
    created_at: '2026-05-11T14:30:00Z',
  },
  {
    id: 'u-doc-2',
    codigo_registro: '150002102',
    ci: '5311022',
    nombre_completo: 'MSc. Claudia Melgar',
    email: 'claudia.melgar@uagrm.edu.bo',
    password: 'docente123',
    rol: Rol.Docente,
    estado: true,
    created_at: '2026-05-11T15:00:00Z',
  },
  {
    id: 'u-doc-3',
    codigo_registro: '150002103',
    ci: '6104052',
    nombre_completo: 'Ing. Fernando Pérez',
    email: 'fernando.perez@uagrm.edu.bo',
    password: 'docente123',
    rol: Rol.Docente,
    estado: true,
    created_at: '2026-05-12T09:00:00Z',
  },
  {
    id: 'u-doc-4',
    codigo_registro: '150002104',
    ci: '7021085',
    nombre_completo: 'MSc. Roberto Pinto',
    email: 'roberto.pinto@uagrm.edu.bo',
    password: 'docente123',
    rol: Rol.Docente,
    estado: true,
    created_at: '2026-05-12T11:00:00Z',
  },
  // Estudiantes (Postulantes)
  {
    id: 'u-est-1',
    codigo_registro: '226040101',
    ci: '9312044',
    nombre_completo: 'Mateo Sandoval Antelo',
    email: 'mateo.sandoval@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-15T08:00:00Z',
  },
  {
    id: 'u-est-2',
    codigo_registro: '226040102',
    ci: '10293021',
    nombre_completo: 'Lucía Benavides Roca',
    email: 'lucia.bena@outlook.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-15T09:15:00Z',
  },
  {
    id: 'u-est-3',
    codigo_registro: '226040103',
    ci: '9320140',
    nombre_completo: 'Sebastián Justiniano Vaca',
    email: 'sebas.justi@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-15T11:45:00Z',
  },
  {
    id: 'u-est-4',
    codigo_registro: '226040104',
    ci: '8841020',
    nombre_completo: 'Valeria Rojas Tarraz',
    email: 'valeria.rojas@uagrm.bo',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-16T10:00:00Z',
  },
  {
    id: 'u-est-5',
    codigo_registro: '226040105',
    ci: '6312450',
    nombre_completo: 'Carlos Eduardo Barba',
    email: 'carlos.barba@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-16T14:20:00Z',
  },
  {
    id: 'u-est-6',
    codigo_registro: '226040106',
    ci: '11002341',
    nombre_completo: 'Aracely Suárez Hurtado',
    email: 'ara.suarez@live.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-17T11:00:00Z',
  },
  {
    id: 'u-est-7',
    codigo_registro: '226040107',
    ci: '9670123',
    nombre_completo: 'Diego Armando Cardona',
    email: 'diego.cardona@uagrm.bo',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-17T15:30:00Z',
  },
  {
    id: 'u-est-8',
    codigo_registro: '226040108',
    ci: '8765432',
    nombre_completo: 'Camila Villarroel Terceros',
    email: 'camila.v@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-18T09:00:00Z',
  },
  {
    id: 'u-est-9',
    codigo_registro: '226040109',
    ci: '6102144',
    nombre_completo: 'Jorge Hugo Ortiz Melgar',
    email: 'jorge.ortiz@outlook.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-18T10:15:00Z',
  },
  {
    id: 'u-est-10',
    codigo_registro: '226040110',
    ci: '9211011',
    nombre_completo: 'Maria René Salvatierra',
    email: 'rene.salvatierra@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-18T16:00:00Z',
  },
  {
    id: 'u-est-11',
    codigo_registro: '226040111',
    ci: '5311200',
    nombre_completo: 'Bruno Aguilera Gasser',
    email: 'bruno.aguilera@uagrm.bo',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-19T08:30:00Z',
  },
  {
    id: 'u-est-12',
    codigo_registro: '226040112',
    ci: '8223114',
    nombre_completo: 'Clara Andrea Ribera',
    email: 'clara.ribera@gmail.com',
    password: 'estudiante123',
    rol: Rol.Estudiante,
    estado: true,
    created_at: '2026-05-19T11:45:00Z',
  },
];

export const ESTUDIANTES_INICIALES: EstudianteDetalle[] = [
  {
    usuario_id: 'u-est-1',
    carrera_opcion_1: 1, // Inf
    carrera_opcion_2: 2, // Sis
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Aprobado',
    colegio_procedencia: 'Colegio De La Sierra',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '77011221',
    direccion: 'UV-54, Barrio Sirari',
    fecha_nacimiento: '2008-03-12',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia, Certificado de Nacimiento',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-2',
    carrera_opcion_1: 1, // Inf
    carrera_opcion_2: 3, // Redes
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Aprobado',
    colegio_procedencia: 'Colegio Alemán',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '69011442',
    direccion: 'Av. Las Américas, Edif. Torres Blancas',
    fecha_nacimiento: '2007-11-22',
    sexo: 'Femenino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia, Certificado de Nacimiento',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-3',
    carrera_opcion_1: 2, // Sis
    carrera_opcion_2: 1, // Inf
    turno_preferido: 'Tarde',
    nro_intentos: 2,
    estado_cup: 'Aprobado',
    colegio_procedencia: 'Colegio Marista',
    ciudad: 'Montero',
    celular: '78013214',
    direccion: 'Calle Warnes Nro. 45',
    fecha_nacimiento: '2006-08-05',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-4',
    carrera_opcion_1: 4, // Comp
    carrera_opcion_2: 1, // Inf
    turno_preferido: 'Noche',
    nro_intentos: 1,
    estado_cup: 'Aprobado',
    colegio_procedencia: 'Colegio Saint George',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '75030214',
    direccion: 'Equipetrol Calle 8',
    fecha_nacimiento: '2007-05-19',
    sexo: 'Femenino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-5',
    carrera_opcion_1: 1, // Inf
    carrera_opcion_2: 3, // Redes
    turno_preferido: 'Tarde',
    nro_intentos: 1,
    estado_cup: 'Aprobado',
    colegio_procedencia: 'Colegio Bautista',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '76110291',
    direccion: 'Av. Mutualista, UV-70',
    fecha_nacimiento: '2008-01-10',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'Exhibe libreta original',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-6',
    carrera_opcion_1: 2, // Sis
    carrera_opcion_2: 3, // Redes
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Reprobado',
    colegio_procedencia: 'C.E. Parroquial',
    ciudad: 'Camiri',
    celular: '70899112',
    direccion: 'Barrio El Prado',
    fecha_nacimiento: '2007-09-14',
    sexo: 'Femenino',
    titulo_bachiller: true,
    otros_documentos: 'Ninguno restante',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-7',
    carrera_opcion_1: 1, // Inf
    carrera_opcion_2: 2, // Sis
    turno_preferido: 'Noche',
    nro_intentos: 2,
    estado_cup: 'Reprobado',
    colegio_procedencia: 'Colegio Nacional Florid',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '70211333',
    direccion: 'Calle Beni Nro. 312',
    fecha_nacimiento: '2005-02-28',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-8',
    carrera_opcion_1: 3, // Redes
    carrera_opcion_2: 2, // Sis
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Inscrito',
    colegio_procedencia: 'U.E. María Auxiliadora',
    ciudad: 'Cotoca',
    celular: '71120042',
    direccion: 'Plaza Principal Cotoca 2 c. al Este',
    fecha_nacimiento: '2008-04-04',
    sexo: 'Femenino',
    titulo_bachiller: true,
    otros_documentos: 'Legalizado título',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-9',
    carrera_opcion_1: 1, // Inf
    carrera_opcion_2: 4, // Comp
    turno_preferido: 'Tarde',
    nro_intentos: 1,
    estado_cup: 'Inscrito',
    colegio_procedencia: 'U.E. Cristo Rey',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '70031122',
    direccion: 'Avenida Santos Dumont, UV-110',
    fecha_nacimiento: '2007-12-01',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-10',
    carrera_opcion_1: 4, // Comp
    carrera_opcion_2: 2, // Sis
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Inscrito',
    colegio_procedencia: 'Colegio Franco Boliviano',
    ciudad: 'Santa Cruz de la Sierra',
    celular: '68910243',
    direccion: 'Av. Grigotá Nro. 520',
    fecha_nacimiento: '2008-02-15',
    sexo: 'Femenino',
    titulo_bachiller: true,
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-11',
    carrera_opcion_1: 2, // Sis
    carrera_opcion_2: 4, // Comp
    turno_preferido: 'Noche',
    nro_intentos: 1,
    estado_cup: 'Postulante', // Pending payment validation
    colegio_procedencia: 'Colegio Anglo Americano',
    ciudad: 'Roboré',
    celular: '79201124',
    direccion: 'Calle Bolívar Nro. 11',
    fecha_nacimiento: '2007-06-30',
    sexo: 'Masculino',
    titulo_bachiller: true,
    otros_documentos: 'Certificado de nacimiento original',
    periodo_cup: '2026/1',
  },
  {
    usuario_id: 'u-est-12',
    carrera_opcion_1: 3, // Redes
    carrera_opcion_2: 1, // Inf
    turno_preferido: 'Mañana',
    nro_intentos: 1,
    estado_cup: 'Postulante', // Pending payment
    colegio_procedencia: 'U.E. Don Bosco',
    ciudad: 'Montero',
    celular: '77211022',
    direccion: 'Barrio Urbari, Montero',
    fecha_nacimiento: '2008-05-14',
    sexo: 'Femenino',
    titulo_bachiller: false, // Requisito faltante!
    otros_documentos: 'CI fotocopia',
    periodo_cup: '2026/1',
  },
];

export const DOCENTES_INICIALES: DocenteDetalle[] = [
  {
    usuario_id: 'u-doc-1',
    especialidad: 'Ciencias de la Computación / Programación',
    es_profesional: true,
    tiene_maestria: true,
    tiene_diplomado: true,
    grupos_asignados: ['g-comp-1'],
  },
  {
    usuario_id: 'u-doc-2',
    especialidad: 'Álgebra y Cálculo Diferencial',
    es_profesional: true,
    tiene_maestria: true,
    tiene_diplomado: true,
    grupos_asignados: ['g-mat-1'],
  },
  {
    usuario_id: 'u-doc-3',
    especialidad: 'Lingüística / Inglés Técnico',
    es_profesional: true,
    tiene_maestria: false,
    tiene_diplomado: true,
    grupos_asignados: ['g-ing-1'],
  },
  {
    usuario_id: 'u-doc-4',
    especialidad: 'Física General / Mecánica Newtoniana',
    es_profesional: true,
    tiene_maestria: true,
    tiene_diplomado: true,
    grupos_asignados: ['g-fis-1'],
  },
];

export const PAGOS_INICIALES: Pago[] = [
  {
    id: 'p-1',
    estudiante_id: 'u-est-1',
    monto: 700.00,
    nro_factura: 'F-2026-0001',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-15T09:00:00Z',
    created_at: '2026-05-15T08:10:00Z',
  },
  {
    id: 'p-2',
    estudiante_id: 'u-est-2',
    monto: 700.00,
    nro_factura: 'F-2026-0002',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-15T10:00:00Z',
    created_at: '2026-05-15T09:20:00Z',
  },
  {
    id: 'p-3',
    estudiante_id: 'u-est-3',
    monto: 700.00,
    nro_factura: 'F-2026-0003',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-15T12:00:00Z',
    created_at: '2026-05-15T11:50:00Z',
  },
  {
    id: 'p-4',
    estudiante_id: 'u-est-4',
    monto: 700.00,
    nro_factura: 'F-2026-0004',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-16T11:00:00Z',
    created_at: '2026-05-16T10:05:00Z',
  },
  {
    id: 'p-5',
    estudiante_id: 'u-est-5',
    monto: 700.00,
    nro_factura: 'F-2026-0005',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-16T15:00:00Z',
    created_at: '2026-05-16T14:30:00Z',
  },
  {
    id: 'p-6',
    estudiante_id: 'u-est-6',
    monto: 700.00,
    nro_factura: 'F-2026-0006',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-17T12:00:00Z',
    created_at: '2026-05-17T11:15:00Z',
  },
  {
    id: 'p-7',
    estudiante_id: 'u-est-7',
    monto: 700.00,
    nro_factura: 'F-2026-0007',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-17T16:00:00Z',
    created_at: '2026-05-17T15:40:00Z',
  },
  {
    id: 'p-8',
    estudiante_id: 'u-est-8',
    monto: 700.00,
    nro_factura: 'F-2026-0008',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-18T09:30:00Z',
    created_at: '2026-05-18T09:05:00Z',
  },
  {
    id: 'p-9',
    estudiante_id: 'u-est-9',
    monto: 700.00,
    nro_factura: 'F-2026-0009',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-18T11:00:00Z',
    created_at: '2026-05-18T10:20:00Z',
  },
  {
    id: 'p-10',
    estudiante_id: 'u-est-10',
    monto: 700.00,
    nro_factura: 'F-2026-0010',
    estado_pago: 'Pagado',
    fecha_pago: '2026-05-18T17:00:00Z',
    created_at: '2026-05-18T16:10:00Z',
  },
  {
    id: 'p-11',
    estudiante_id: 'u-est-11',
    monto: 700.00,
    nro_factura: 'F-2026-0011',
    estado_pago: 'Pendiente',
    created_at: '2026-05-19T08:35:00Z',
  },
];

export const GRUPOS_INICIALES: Grupo[] = [
  {
    id: 'g-comp-1',
    sigla: 'Grupo 1',
    materia_id: 1, // Computación
    docente_id: 'u-doc-1',
    turno: 'Mañana',
    cupo_maximo: 70,
    estudiantes_ids: ['u-est-1', 'u-est-2', 'u-est-3', 'u-est-4', 'u-est-5', 'u-est-6', 'u-est-7', 'u-est-8', 'u-est-9', 'u-est-10'],
  },
  {
    id: 'g-mat-1',
    sigla: 'Grupo 1',
    materia_id: 2, // Matemáticas
    docente_id: 'u-doc-2',
    turno: 'Mañana',
    cupo_maximo: 70,
    estudiantes_ids: ['u-est-1', 'u-est-2', 'u-est-3', 'u-est-4', 'u-est-5', 'u-est-6', 'u-est-7', 'u-est-8', 'u-est-9', 'u-est-10'],
  },
  {
    id: 'g-ing-1',
    sigla: 'Grupo 1',
    materia_id: 3, // Inglés
    docente_id: 'u-doc-3',
    turno: 'Tarde',
    cupo_maximo: 70,
    estudiantes_ids: ['u-est-1', 'u-est-2', 'u-est-3', 'u-est-4', 'u-est-5', 'u-est-6', 'u-est-7', 'u-est-8', 'u-est-9', 'u-est-10'],
  },
  {
    id: 'g-fis-1',
    sigla: 'Grupo 1',
    materia_id: 4, // Física
    docente_id: 'u-doc-4',
    turno: 'Noche',
    cupo_maximo: 70,
    estudiantes_ids: ['u-est-1', 'u-est-2', 'u-est-3', 'u-est-4', 'u-est-5', 'u-est-6', 'u-est-7', 'u-est-8', 'u-est-10'],
  },
];

export const NOTAS_INICIALES: Nota[] = [
  // Student 1 (Mateo Sandoval Antelo) - Passed!
  { id: 'n-1-1', estudiante_id: 'u-est-1', materia_id: 1, nota_parcial_1: 8, nota_parcial_2: 9, nota_examen_final: 10, nota_final_materia: 90 },
  { id: 'n-1-2', estudiante_id: 'u-est-1', materia_id: 2, nota_parcial_1: 7, nota_parcial_2: 8, nota_examen_final: 9, nota_final_materia: 80 },
  { id: 'n-1-3', estudiante_id: 'u-est-1', materia_id: 3, nota_parcial_1: 9, nota_parcial_2: 9, nota_examen_final: 9, nota_final_materia: 90 },
  { id: 'n-1-4', estudiante_id: 'u-est-1', materia_id: 4, nota_parcial_1: 8, nota_parcial_2: 9, nota_examen_final: 9, nota_final_materia: 86.7 },

  // Student 2 (Lucia Benavides Roca) - Passed!
  { id: 'n-2-1', estudiante_id: 'u-est-2', materia_id: 1, nota_parcial_1: 10, nota_parcial_2: 10, nota_examen_final: 10, nota_final_materia: 100 },
  { id: 'n-2-2', estudiante_id: 'u-est-2', materia_id: 2, nota_parcial_1: 6, nota_parcial_2: 7, nota_examen_final: 8, nota_final_materia: 70 },
  { id: 'n-2-3', estudiante_id: 'u-est-2', materia_id: 3, nota_parcial_1: 8, nota_parcial_2: 8, nota_examen_final: 9, nota_final_materia: 83.3 },
  { id: 'n-2-4', estudiante_id: 'u-est-2', materia_id: 4, nota_parcial_1: 7, nota_parcial_2: 7, nota_examen_final: 8, nota_final_materia: 73.3 },

  // Student 3 (Sebastian Justiniano) - Passed!
  { id: 'n-3-1', estudiante_id: 'u-est-3', materia_id: 1, nota_parcial_1: 6, nota_parcial_2: 7, nota_examen_final: 8, nota_final_materia: 70 },
  { id: 'n-3-2', estudiante_id: 'u-est-3', materia_id: 2, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 63.3 },
  { id: 'n-3-3', estudiante_id: 'u-est-3', materia_id: 3, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 63.3 },
  { id: 'n-3-4', estudiante_id: 'u-est-3', materia_id: 4, nota_parcial_1: 5, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 60 },

  // Student 4 (Valeria Rojas) - Passed!
  { id: 'n-4-1', estudiante_id: 'u-est-4', materia_id: 1, nota_parcial_1: 9, nota_parcial_2: 8, nota_examen_final: 9, nota_final_materia: 86.7 },
  { id: 'n-4-2', estudiante_id: 'u-est-4', materia_id: 2, nota_parcial_1: 7, nota_parcial_2: 8, nota_examen_final: 8, nota_final_materia: 76.7 },
  { id: 'n-4-3', estudiante_id: 'u-est-4', materia_id: 4, nota_parcial_1: 7, nota_parcial_2: 7, nota_examen_final: 8, nota_final_materia: 73.3 },

  // Student 5 (Carlos Eduardo Barba) - Passed!
  { id: 'n-5-1', estudiante_id: 'u-est-5', materia_id: 1, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 63.3 },
  { id: 'n-5-2', estudiante_id: 'u-est-5', materia_id: 2, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 63.3 },
  { id: 'n-5-3', estudiante_id: 'u-est-5', materia_id: 3, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 7, nota_final_materia: 63.3 },
  { id: 'n-5-4', estudiante_id: 'u-est-5', materia_id: 4, nota_parcial_1: 6, nota_parcial_2: 6, nota_examen_final: 6, nota_final_materia: 60 },

  // Student 6 (Aracely Suarez) - Failed (Reprobado)!
  { id: 'n-6-1', estudiante_id: 'u-est-6', materia_id: 1, nota_parcial_1: 4, nota_parcial_2: 4, nota_examen_final: 5, nota_final_materia: 43.3 },
  { id: 'n-6-2', estudiante_id: 'u-est-6', materia_id: 2, nota_parcial_1: 3, nota_parcial_2: 3, nota_examen_final: 4, nota_final_materia: 33.3 },
  { id: 'n-6-3', estudiante_id: 'u-est-6', materia_id: 3, nota_parcial_1: 5, nota_parcial_2: 5, nota_examen_final: 6, nota_final_materia: 53.3 },
  { id: 'n-6-4', estudiante_id: 'u-est-6', materia_id: 4, nota_parcial_1: 4, nota_parcial_2: 4, nota_examen_final: 4, nota_final_materia: 40 },

  // Student 7 (Diego Armando Cardona) - Failed (Reprobado)!
  { id: 'n-7-1', estudiante_id: 'u-est-7', materia_id: 1, nota_parcial_1: 6, nota_parcial_2: 5, nota_examen_final: 6, nota_final_materia: 56.7 },
  { id: 'n-7-2', estudiante_id: 'u-est-7', materia_id: 2, nota_parcial_1: 4, nota_parcial_2: 5, nota_examen_final: 5, nota_final_materia: 46.7 },
  { id: 'n-7-4', estudiante_id: 'u-est-7', materia_id: 4, nota_parcial_1: 5, nota_parcial_2: 5, nota_examen_final: 6, nota_final_materia: 53.3 },

  // Student 8 (Camila Villarroel) - Partially graded (Inscrito status)
  { id: 'n-8-1', estudiante_id: 'u-est-8', materia_id: 1, nota_parcial_1: 7, nota_parcial_2: 0, nota_examen_final: 0, nota_final_materia: 23.3 },
  { id: 'n-8-2', estudiante_id: 'u-est-8', materia_id: 2, nota_parcial_1: 6, nota_parcial_2: 0, nota_examen_final: 0, nota_final_materia: 20 },

  // Student 9 (Jorge Hugo Ortiz) - Partially graded (Inscrito)
  { id: 'n-9-1', estudiante_id: 'u-est-9', materia_id: 1, nota_parcial_1: 6, nota_parcial_2: 5, nota_examen_final: 0, nota_final_materia: 36.7 },

  // Student 10 (Maria Rene Salvatierra) - Partially graded (Inscrito)
  { id: 'n-10-1', estudiante_id: 'u-est-10', materia_id: 2, nota_parcial_1: 8, nota_parcial_2: 8, nota_examen_final: 0, nota_final_materia: 53.3 },
];

export const ASISTENCIAS_INICIALES: Asistencia[] = [
  { id: 'a-1', estudiante_id: 'u-est-1', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },
  { id: 'a-2', estudiante_id: 'u-est-2', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },
  { id: 'a-3', estudiante_id: 'u-est-3', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },
  { id: 'a-4', estudiante_id: 'u-est-4', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },
  { id: 'a-5', estudiante_id: 'u-est-5', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Falta' },
  { id: 'a-6', estudiante_id: 'u-est-6', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },
  { id: 'a-7', estudiante_id: 'u-est-7', grupo_id: 'g-comp-1', fecha: '2026-06-01', estado: 'Presente' },

  { id: 'a-8', estudiante_id: 'u-est-1', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Presente' },
  { id: 'a-9', estudiante_id: 'u-est-2', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Presente' },
  { id: 'a-10', estudiante_id: 'u-est-3', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Falta' },
  { id: 'a-11', estudiante_id: 'u-est-4', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Presente' },
  { id: 'a-12', estudiante_id: 'u-est-5', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Presente' },
  { id: 'a-13', estudiante_id: 'u-est-6', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Falta' },
  { id: 'a-14', estudiante_id: 'u-est-7', grupo_id: 'g-comp-1', fecha: '2026-06-02', estado: 'Presente' },
];

export const BITACORAS_INICIALES: Bitacora[] = [
  {
    id: 'b-1',
    usuario_id: 'u-1',
    usuario_nombre: 'Carlos Andres Pimentel Garena',
    accion: 'Carga inicial del sistema CUP aprobada con 12 alumnos semilla.',
    modulo: 'SISTEMA CONTROLLER',
    ip_address: '200.87.120.45',
    created_at: '2026-06-01T08:00:00Z',
  },
  {
    id: 'b-2',
    usuario_id: 'u-1',
    usuario_nombre: 'Carlos Andres Pimentel Garena',
    accion: 'Inscripción automática por pago validado del postulante Mateo Sandoval.',
    modulo: 'MÓDULO ADMISIÓN',
    ip_address: '200.87.120.45',
    created_at: '2026-06-01T09:12:00Z',
  },
  {
    id: 'b-3',
    usuario_id: 'u-doc-1',
    usuario_nombre: 'Dr. Alberto Valenzuela',
    accion: 'Registo de asistencia de Computación - Grupo 1, fecha 2026-06-01.',
    modulo: 'MÓDULO ASISTENCIA',
    ip_address: '190.186.40.12',
    created_at: '2026-06-01T18:30:00Z',
  },
  {
    id: 'b-4',
    usuario_id: 'u-doc-1',
    usuario_nombre: 'Dr. Alberto Valenzuela',
    accion: 'Modificación de notas de examen final de Computación para Lucía Benavides.',
    modulo: 'MÓDULO EVALUACIÓN',
    ip_address: '190.186.40.12',
    created_at: '2026-06-02T10:15:00Z',
  },
];

export const HISTORIAL_APROBADOS_INICIALES: HistorialAprobado[] = [
  // 2024 Approved students
  {
    id: 'ha-1',
    ano: 2024,
    nombre_completo: 'Alejandro Melgar Camacho',
    ci: '9124021',
    codigo_registro: '224010204',
    carrera_admitida: 'Ingeniería de Sistemas',
    gpa: 82.5,
    colegio_procedencia: 'Colegio Saint George'
  },
  {
    id: 'ha-2',
    ano: 2024,
    nombre_completo: 'María Fernanda Lijerón',
    ci: '8314552',
    codigo_registro: '224010502',
    carrera_admitida: 'Ingeniería Informática',
    gpa: 76.0,
    colegio_procedencia: 'Colegio María Auxiliadora'
  },
  {
    id: 'ha-3',
    ano: 2024,
    nombre_completo: 'Gustavo Adolfo Antelo',
    ci: '7412030',
    codigo_registro: '224021115',
    carrera_admitida: 'Ingeniería en Ciencias de la Computación',
    gpa: 64.3,
    colegio_procedencia: 'Colegio Bautista'
  },
  
  // 2025 Approved students
  {
    id: 'ha-4',
    ano: 2025,
    nombre_completo: 'Valeria Justiniano Pinto',
    ci: '10924040',
    codigo_registro: '225011920',
    carrera_admitida: 'Ingeniería en Redes y Telecomunicaciones',
    gpa: 89.2,
    colegio_procedencia: 'Colegio Alemán'
  },
  {
    id: 'ha-5',
    ano: 2025,
    nombre_completo: 'René Vargas Salvatierra',
    ci: '9100230',
    codigo_registro: '225021008',
    carrera_admitida: 'Ingeniería de Sistemas',
    gpa: 71.8,
    colegio_procedencia: 'C.E. Parroquial'
  },
  {
    id: 'ha-6',
    ano: 2025,
    nombre_completo: 'Camila Andrea Vaca',
    ci: '8401323',
    codigo_registro: '225041005',
    carrera_admitida: 'Ingeniería Informática',
    gpa: 68.1,
    colegio_procedencia: 'Colegio Marista'
  }
];
