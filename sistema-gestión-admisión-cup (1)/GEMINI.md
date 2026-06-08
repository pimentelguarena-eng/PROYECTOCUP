# Instrucciones de Diseño y Directrices Técnicas - Administrador de Admisión CUP (FICCT - UAGRM)

Este archivo define las especificaciones del diseño visual, reglas de negocio e implementaciones de UI para el **Sistema de Gestión de Admisión CUP** de la Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones (FICCT) en la UAGRM. 

---

## 🏗️ 1. Arquitectura Dividida (Frontend & Backend)

Para cumplir con las directrices institucionales y garantizar un alto rendimiento, escalabilidad y separación de responsabilidades, el sistema académico se divide estrictamente en dos capas:

```
                  ┌───────────────────────────────────────────────┐
                  │          FRONTEND DEVELOPMENT (Vite)          │
                  │      React 18 + TS + Tailwind + Lucide        │
                  │  (Ubicación: Carpeta raiz, corre en puerto)   │
                  └───────────────────────┬───────────────────────┘
                                          │
                            Peticiones HTTP REST (JSON)
                                 (Bearer JWT)
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │           BACKEND SERVICES (Laravel)          │
                  │         PHP Laravel 10/11 Framework           │
                  │    (Ubicación: Directorio /backend-laravel)   │
                  └───────────────────────┬───────────────────────┘
                                          │
                                       Eloquent
                                     PostgreSQL
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │             DATABASE ENGINE (SQL)             │
                  │             Relational PostgreSQL             │
                  │            (ficct_cup_db en Postgres)         │
                  └───────────────────────────────────────────────┘
```

1. **Frontend (Vite / React 18 / TypeScript / Tailwind CSS)**:
   - Se encarga de la interfaz interactiva con el usuario.
   - Cuenta con un cliente API centralizado (`src/lib/laravelApi.ts`) que maneja las cabeceras HTTP, intercepta los tokens Bearer Sanctum, y se comunica con el servidor backend.
   - En el entorno de previsualización (AI Studio Sandbox), el frontend utiliza un mecanismo híbrido inteligente: si no detecta una conexión activa al backend Laravel, realiza un **fallback transparente** hacia el datastore persistente en el navegador (`localStorage`) para que todas las simulaciones de roles, validaciones de notas y pagos sigan siendo 100% interactivas y operativas en tiempo real.

2. **Backend (PHP Laravel 10/11 + Sanctum + PostgreSQL)**:
   - Ubicado de forma independiente dentro del directorio `/backend-laravel`.
   - Se encarga de la lógica de negocio, control de concurrencia, transacciones financieras de validación de Boletas de 700.00 Bs, cálculo ponderado de notas finales, y asignación de matriculados según orden de mérito académico por mejores promedios.

---

## 🎨 2. Sistema de Diseño e Identidad Visual (Frontend)

El sistema académico utiliza un enfoque de **dos estados de contraste**:
- **Pantalla de Autenticación (Modo Nocturno "Cosmic Slate")**: Fondo ultra dark (`bg-slate-950`), bordes elegantes (`border-slate-800`), decoraciones de gradientes sutiles en las esquinas superiores e inferiores con `blur-3xl`, y tipografía e íconos contrastados (`text-blue-500`, `text-emerald-500`).
- **Portal de Trabajo (Modo Diurno "Academic Clean")**: Fondo luminoso y limpio (`bg-slate-50`), bordes y divisiones definidos (`border-slate-200`), rejillas de cuadrícula sutiles (`grid-lines`) para potenciar el orden académico, y textos con legibilidad de contraste de color alta (`text-slate-900`, `text-slate-650`).

### Tipografía & Ritmo Visual
- **Títulos y Cabeceras**: Estilo sans-serif limpio (`Inter` u `Outfit`) con tracking estrecho y negrita pesada (`font-black tracking-tight text-slate-900 uppercase`).
- **Registros y Datos**: Estilo monoespaciado (`JetBrains Mono` / `font-mono text-xs`) para códigos de registro académico, C.I., montos de dinero (Ej: `700.00 Bs.`), calificaciones y estados de asistencia.

---

## 🔐 3. Reglas de Autenticación y Registro de Usuarios

El flujo de acceso al sistema se rige bajo una política estricta de seguridad física y controles institucionales de la UAGRM:

1. **Auto-registro EXCLUSIVO para Estudiantes**:
   - Solo los nuevos postulantes al **CUP** (Estudiantes) pueden registrar su cuenta de manera autónoma en el sistema.
   - Al registrarse, el estudiante ingresa su Nombre Completo, su Cédula de Identidad (C.I.), su Correo Electrónico, sus dos opciones de carrera (pertenecientes a la FICCT), su turno y colegio de procedencia.
   - El sistema le asigna un **Código de Registro Académico** único aleatorio de forma automática (con formato `2260XXXXX`).

2. **Personal Docente y Administrativo (SIN AUTO-REGISTRO)**:
   - **Prohibición**: No existe opción en la interfaz pública ni formulario para que los Docentes o Administrativos se auto-registren.
   - **Flujo Real**: El personal de administración central realiza su registro físico directo y les envía su correo electrónico de bienvenida institucional. El usuario ingresa directamente usando su email, C.I. o código asignado utilizando el flujo único de la pestaña "Ingresar al Portal".
   - **Mensaje de Soporte**: Se muestra un panel de aviso informativo (`AlertCircle` azul de Lucid-React) dentro de la pestaña de registro indicando esta limitación oficial.

### Lógica de Login (Multipropósito)
Tanto la capa frontend como el backend Laravel permiten validar las credenciales del usuario evaluando tres atributos únicos:
```php
$user = User::whereRaw('LOWER(email) = ?', [strtolower(trim($loginEmail))])
            ->orWhere('codigo_registro', trim($loginEmail))
            ->orWhere('ci', trim($loginEmail))
            ->first();
```

---

## 🗄️ 4. Estructura de la Base de Datos (PostgreSQL)

El sistema de persistencia en PostgreSQL (`ficct_cup_db`) se define en las migraciones de Laravel bajo los siguientes modelos relacionales de datos:

### 1- Tabla: `carreras`
*   `id` (Primary Key, Auto-increment)
*   `nombre` (unique, string, max 150)
*   `cupo_maximo` (integer, default 5)

### 2- Tabla: `usuarios`
*   `id` (Primary Key, string e.g. `u-1`, `u-est-1`)
*   `codigo_registro` (unique, string)
*   `ci` (unique, string, Cédula de Identidad)
*   `nombre_completo` (string)
*   `email` (unique, case-insensitive string)
*   `password` (string hash)
*   `rol` (enum: `Administrador`, `Docente`, `Estudiante`)
*   `estado` (boolean, default true)

### 3- Tabla: `estudiante_detalles`
*   `usuario_id` (Primary Key, Foreign Key -> `usuarios.id`, cascade)
*   `carrera_opcion_1` (Foreign Key -> `carreras.id`)
*   `carrera_opcion_2` (Foreign Key -> `carreras.id`)
*   `turno_preferido` (enum: `Mañana`, `Tarde`, `Noche`)
*   `nro_intentos` (integer)
*   `estado_cup` (enum: `Postulante`, `Inscrito`, `Aprobado`, `Reprobado`)
*   `colegio_procedencia` (string)
*   `ciudad` (string)
*   `celular` (string)
*   `direccion` (string)
*   `fecha_nacimiento` (date)
*   `sexo` (enum: `Femenino`, `Masculino`)
*   `titulo_bachiller` (boolean, default false)
*   `otros_documentos` (text, nullable)

### 4- Tabla: `docente_detalles`
*   `usuario_id` (Primary Key, Foreign Key -> `usuarios.id`, cascade)
*   `especialidad` (string)
*   `es_profesional` (boolean, default true)
*   `tiene_maestria` (boolean, default false)
*   `tiene_diplomado` (boolean, default false)
*   `grupos_asignados` (json array of group strings, nullable)

### 5- Tabla: `pagos`
*   `id` (Primary key, string)
*   `estudiante_id` (Foreign Key -> `estudiante_detalles.usuario_id`, cascade)
*   `monto` (decimal, strictly `700.00` Bs)
*   `nro_factura` (unique, string)
*   `estado_pago` (enum: `Pendiente`, `Pagado`)
*   `fecha_pago` (datetime, nullable)
*   `comprobante_url` (string context, visual receipt mock upload)

### 6- Tabla: `materias`
*   `id` (Primary Key, Auto-increment)
*   `nombre` (enum: `Computación`, `Matemáticas`, `Inglés`, `Física`)

### 7- Tabla: `grupos`
*   `id` (Primary Key, string)
*   `sigla` (string e.g. `Grupo 21`, `G1`)
*   `materia_id` (Foreign Key -> `materias.id`, cascade)
*   `docente_id` (Foreign Key -> `usuarios.id`, nullable)
*   `turno` (enum: `Mañana`, `Tarde`, `Noche`)
*   `cupo_maximo` (integer, default 70)
*   `estudiantes_ids` (json array of string ids, nullable)

### 8- Tabla: `asistencias`
*   `id` (Primary Key, string)
*   `estudiante_id` (Foreign Key -> `usuarios.id`, cascade)
*   `grupo_id` (Foreign Key -> `grupos.id`, cascade)
*   `fecha` (date)
*   `estado` (enum: `Presente`, `Falta`)

### 9- Tabla: `notas`
*   `id` (Primary Key, string)
*   `estudiante_id` (Foreign Key -> `usuarios.id`, cascade)
*   `materia_id` (Foreign Key -> `materias.id`, cascade)
*   `nota_parcial_1` (integer, default 0)
*   `nota_parcial_2` (integer, default 0)
*   `nota_examen_final` (integer, default 0)
*   `nota_final_materia` (integer, calculated average of exams, default 0)

### 10- Tabla: `bitacoras`
*   `id` (Primary key, string)
*   `usuario_id` (Foreign key -> `usuarios.id`, nullable)
*   `usuario_nombre` (string, cache value)
*   `accion` (string description)
*   `modulo` (string e.g. `ADMIN CONFIG`, `CALIFICACIONES_CUP`, `PAGOS`)
*   `ip_address` (string)

---

## 🚀 5. API Endpoints Map (Laravel `routes/api.php`)

Todos los endpoints están protegidos por middleware Sanctum y ordenados por perfiles:

### Públicos
*   `POST /api/v1/auth/login` - Inicio de sesión multipropósito.

### Privados (Autenticados con Bearer Tokens)
*   `GET /api/v1/user` - Retorna los datos y perfil completo del usuario autenticado.
*   `POST /api/v1/auth/logout` - Revoca tokens de sesión y destruye persistencia temporal.

#### 🎓 Estudiantes
*   `GET /api/v1/estudiante/profile` - Visualiza asignaciones de carrera y facturas académicas del CUP.
*   `POST /api/v1/estudiante/pago/upload` - Registra boleta física de depósito para validación administrativa (700.00 Bs).
*   `POST /api/v1/estudiante/documentos/update` - Modifica el título de bachiller u otros adjuntos.

#### 👨‍🏫 Docentes
*   `GET /api/v1/docente/grupos` - Lista los grupos asignados al docente autenticado.
*   `GET /api/v1/docente/grupo/{id}/students` - Detalla los alumnos inscritos y sus notas de parciales.
*   `POST /api/v1/docente/grades/save` - Registra parcial 1, parcial 2, examen final y calcula promedio de forma atómica.

#### 👑 Administradores
*   `GET /api/v1/admin/dashboard-stats` - Estadísticas financieras, cupos de la facultad y postulantes.
*   `GET /api/v1/admin/logs` - Bitácora de operaciones y auditorías del sistema CUP.
*   `POST /api/v1/admin/carreras/{id}/quota` - Configura la capacidad de vacantes máximas de cupo por carrera.
*   `GET /api/v1/admin/pagos/pending` - Lista depósitos en revisión de 700Bs.
*   `POST /api/v1/admin/pagos/{id}/verify` - Valida comprobantes de pago de forma oficial.
*   `POST /api/v1/admin/admission/close-period` - Cierre oficial de cupos para admitidos mediante promedio académico (GPA) ordenados en orden descendente.

---

## 🔧 6. Guía de Instalación y Despliegue del Backend

Para levantar el servidor independiente de Laravel, siga los siguientes pasos:

1.  **Ingresar a la carpeta del backend**:
    ```bash
    cd backend-laravel
    ```
2.  **Instalar dependencias de PHP**:
    ```bash
    composer install
    ```
3.  **Configurar archivo de entorno**:
    ```bash
    cp .env.example .env
    ```
    Configure sus credenciales de base de datos PostgreSQL:
    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=ficct_cup_db
    DB_USERNAME=postgres
    DB_PASSWORD=su_password_de_postgres
    ```
4.  **Generar clave de aplicación única**:
    ```bash
    php artisan key:generate
    ```
5.  **Ejecutar migraciones y semilla inicial (Seeder)**:
    Este comando creará todo el esquema relacional en PostgreSQL e insertará las materias, las carreras y los perfiles de demostración:
    ```bash
    php artisan migrate:fresh --seed
    ```
6.  **Iniciar el servidor local**:
    ```bash
    php artisan serve
    ```
    El servidor backend estará listo en `http://127.0.0.1:8000`.
