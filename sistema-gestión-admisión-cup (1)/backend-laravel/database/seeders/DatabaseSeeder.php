<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Permiso;
use App\Models\Carrera;
use App\Models\Materia;
use App\Models\User;
use App\Models\Estudiante;
use App\Models\Docente;
use App\Models\Pago;
use App\Models\Grupo;
use App\Models\Nota;
use App\Models\Bitacora;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ----------------------------------------------------------------------------
        // 1. ROLES Y PERMISOS
        // ----------------------------------------------------------------------------
        
        $adminRole = Role::create(['id' => 1, 'nombre' => 'Administrador', 'descripcion' => 'Administración general académica del CUP']);
        $docenteRole = Role::create(['id' => 2, 'nombre' => 'Docente', 'descripcion' => 'Verificación de asistencia y registro de calificaciones']);
        $estudianteRole = Role::create(['id' => 3, 'nombre' => 'Estudiante', 'descripcion' => 'Nuevos postulantes de la FICCT']);

        $p1 = Permiso::create(['id' => 1, 'nombre' => 'crear-usuario', 'descripcion' => 'Registrar nuevos estudiantes manualmente']);
        $p2 = Permiso::create(['id' => 2, 'nombre' => 'subir-nota', 'descripcion' => 'Subir o modificar notas parciales y finales']);
        $p3 = Permiso::create(['id' => 3, 'nombre' => 'validar-pago', 'descripcion' => 'Validar depósitos bancarios de aranceles de 700Bs']);
        $p4 = Permiso::create(['id' => 4, 'nombre' => 'admitir-postulantes', 'descripcion' => 'Cierre del periodo y asignación de vacantes']);

        // Link Permissions to Admin (All)
        $adminRole->permisos()->sync([1, 2, 3, 4]);

        // Link Permissions to Docente (Subir nota)
        $docenteRole->permisos()->sync([2]);

        // ----------------------------------------------------------------------------
        // 2. CARRERAS Y MATERIAS
        // ----------------------------------------------------------------------------
        
        $c1 = Carrera::create(['id' => 1, 'nombre' => 'Ingeniería Informática', 'cupo_maximo' => 5]);
        $c2 = Carrera::create(['id' => 2, 'nombre' => 'Ingeniería en Sistemas', 'cupo_maximo' => 4]);
        $c3 = Carrera::create(['id' => 3, 'nombre' => 'Ingeniería Redes y Telecomunicaciones', 'cupo_maximo' => 6]);
        $c4 = Carrera::create(['id' => 4, 'nombre' => 'Robótica', 'cupo_maximo' => 3]);

        $m1 = Materia::create(['id' => 1, 'nombre' => 'Computación']);
        $m2 = Materia::create(['id' => 2, 'nombre' => 'Matemáticas']);
        $m3 = Materia::create(['id' => 3, 'nombre' => 'Inglés']);
        $m4 = Materia::create(['id' => 4, 'nombre' => 'Física']);

        // ----------------------------------------------------------------------------
        // 3. NUEVOS USUARIOS Y SUS PERFILES
        // ----------------------------------------------------------------------------

        // Admin: Carlos Andres Pimentel Garena
        $admin = User::create([
            'id' => 1,
            'codigo_registro' => '220000001',
            'ci' => '8877665',
            'nombre_completo' => 'Carlos Andres Pimentel Garena',
            'email' => 'carlos.pimentel@uagrm.edu.bo',
            'password' => bcrypt('61517085'),
            'rol_id' => 1,
            'estado' => true
        ]);

        // Docente: Dr. Alberto Valenzuela
        $docUser = User::create([
            'id' => 2,
            'codigo_registro' => '150002101',
            'ci' => '4922011',
            'nombre_completo' => 'Dr. Alberto Valenzuela',
            'email' => 'alberto.valenzuela@uagrm.edu.bo',
            'password' => bcrypt('docente123'),
            'rol_id' => 2,
            'estado' => true
        ]);
        Docente::create([
            'usuario_id' => 2,
            'especialidad' => 'Computación'
        ]);

        // Estudiante Aprobado: Mateo Sandoval Antelo
        $s1 = User::create([
            'id' => 3,
            'codigo_registro' => '226040101',
            'ci' => '9312044',
            'nombre_completo' => 'Mateo Sandoval Antelo',
            'email' => 'mateo.sandoval@gmail.com',
            'password' => bcrypt('estudiante123'),
            'rol_id' => 3,
            'estado' => true
        ]);
        Estudiante::create([
            'usuario_id' => 3,
            'carrera_opcion_1' => 1,
            'carrera_opcion_2' => 2,
            'turno_preferido' => 'Mañana',
            'nro_intentos' => 1,
            'estado_cup' => 'Aprobado',
            'colegio_procedencia' => 'Colegio Marista',
            'ciudad' => 'Santa Cruz',
            'celular' => '78012345',
            'direccion' => 'Av. San Aurelio, Calle 4',
            'fecha_nacimiento' => '2008-03-12',
            'sexo' => 'Masculino',
            'titulo_bachiller' => true
        ]);
        Pago::create([
            'id' => 1,
            'estudiante_id' => 3,
            'monto' => 700.00,
            'nro_factura' => 'FAC-99201',
            'estado_pago' => 'Pagado',
            'fecha_pago' => now(),
            'comprobante_url' => 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=300&q=80'
        ]);

        // Estudiante Pendiente: Sebastián Justiniano Vaca
        $s2 = User::create([
            'id' => 4,
            'codigo_registro' => '226040103',
            'ci' => '9320140',
            'nombre_completo' => 'Sebastián Justiniano Vaca',
            'email' => 'sebas.justi@gmail.com',
            'password' => bcrypt('estudiante123'),
            'rol_id' => 3,
            'estado' => true
        ]);
        Estudiante::create([
            'usuario_id' => 4,
            'carrera_opcion_1' => 1,
            'carrera_opcion_2' => 4,
            'turno_preferido' => 'Tarde',
            'nro_intentos' => 2,
            'estado_cup' => 'Postulante',
            'colegio_procedencia' => 'Colegio De La Sierra',
            'ciudad' => 'Santa Cruz',
            'celular' => '70921440',
            'direccion' => 'Barrio Sirari, Calle Guembé',
            'fecha_nacimiento' => '2007-11-20',
            'sexo' => 'Masculino',
            'titulo_bachiller' => true
        ]);
        Pago::create([
            'id' => 2,
            'estudiante_id' => 4,
            'monto' => 700.00,
            'nro_factura' => 'QR-PAG-38012',
            'estado_pago' => 'Pendiente',
            'fecha_pago' => null,
            'comprobante_url' => 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=300&q=80'
        ]);

        // ----------------------------------------------------------------------------
        // 4. GRUPOS Y SECCIÓN DE MATRICULAS (grupo_estudiante)
        // ----------------------------------------------------------------------------
        
        $g1 = Grupo::create([
            'id' => 1,
            'sigla' => 'Grupo 21',
            'materia_id' => 1,
            'docente_id' => 2,
            'turno' => 'Mañana',
            'cupo_maximo' => 70
        ]);

        // Connect students to Group 21 via student-group pivot
        $g1->estudiantes()->sync([3, 4]);

        // ----------------------------------------------------------------------------
        // 5. CALIFICACIONES Y NOTAS
        // ----------------------------------------------------------------------------
        
        Nota::create([
            'id' => 1,
            'estudiante_id' => 3,
            'materia_id' => 1,
            'nota_parcial_1' => 85.00,
            'nota_parcial_2' => 90.00,
            'nota_examen_final' => 88.00,
            'nota_final_materia' => 88.00
        ]);

        // ----------------------------------------------------------------------------
        // 6. OPERACIONES DE BITACORA
        // ----------------------------------------------------------------------------
        
        Bitacora::create([
            'id' => 1,
            'usuario_id' => 1,
            'accion' => 'Apertura oficial del portal de admisión CUP Gestión II-2026 en motor PostgreSQL',
            'modulo' => 'ADMIN CONFIG',
            'ip_address' => '190.181.240.100'
        ]);
    }
}
