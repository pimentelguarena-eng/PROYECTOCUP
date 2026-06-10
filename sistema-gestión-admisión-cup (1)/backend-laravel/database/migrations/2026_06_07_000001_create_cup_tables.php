<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ----------------------------------------------------------------------------
        // 1. PAQUETE: GESTIÓN DE USUARIOS Y SEGURIDAD
        // ----------------------------------------------------------------------------

        // Tabla de Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id(); // SERIAL PRIMARY KEY
            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
        });

        // Tabla de Permisos
        Schema::create('permisos', function (Blueprint $table) {
            $table->id(); // SERIAL PRIMARY KEY
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
        });

        // Tabla Intermedia: Matriz de Privilegios (Asociación de Roles y Permisos)
        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->foreignId('rol_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permiso_id')->constrained('permisos')->onDelete('cascade');
            $table->primary(['rol_id', 'permiso_id']);
        });

        // Tabla Maestra de Usuarios
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->string('codigo_registro', 20)->unique();
            $table->string('ci', 15)->unique();
            $table->string('nombre_completo', 150);
            $table->string('email', 100)->unique();
            $table->string('password', 255);
            $table->foreignId('rol_id')->constrained('roles');
            $table->boolean('estado')->default(true);
            $table->timestamps(); // created_at, updated_at
        });

        // Tabla de Auditoría: Bitácora Transversal
        Schema::create('bitacoras', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->string('accion', 255);
            $table->string('modulo', 100);
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ----------------------------------------------------------------------------
        // 2. PAQUETE: REGISTROS Y ADMISIÓN DE POSTULANTES
        // ----------------------------------------------------------------------------

        // Tabla de Carreras
        Schema::create('carreras', function (Blueprint $table) {
            $table->id(); // SERIAL PRIMARY KEY
            $table->string('nombre', 100)->unique();
            $table->integer('cupo_maximo')->default(5);
        });

        // Tabla de Estudiantes (Especialización de Usuarios)
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->foreignId('usuario_id')->primary()->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('carrera_opcion_1')->constrained('carreras');
            $table->foreignId('carrera_opcion_2')->constrained('carreras');
            $table->string('turno_preferido', 15);
            $table->integer('nro_intentos')->default(1);
            $table->string('estado_cup', 20)->default('Postulante');
            
            // Auxiliary fields utilized in UAGRM portal profiles
            $table->string('colegio_procedencia', 150)->nullable();
            $table->string('ciudad', 100)->nullable();
            $table->string('celular', 20)->nullable();
            $table->string('direccion', 200)->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->string('sexo', 15)->nullable();
            $table->boolean('titulo_bachiller')->default(false);
            $table->text('otros_documentos')->nullable();
        });

        // Tabla de Docentes (Especialización de Usuarios)
        Schema::create('docentes', function (Blueprint $table) {
            $table->foreignId('usuario_id')->primary()->constrained('usuarios')->onDelete('cascade');
            $table->string('especialidad', 100)->nullable();
        });

        // Tabla de Gestión de Pagos de Inscripción
        Schema::create('pagos', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->foreignId('estudiante_id')->constrained('estudiantes', 'usuario_id')->onDelete('cascade');
            $table->decimal('monto', 8, 2)->default(700.00);
            $table->string('nro_factura', 50)->unique()->nullable();
            $table->string('estado_pago', 15)->default('Pendiente');
            $table->timestamp('fecha_pago')->nullable();
            $table->string('comprobante_url', 400)->nullable(); // Included field for visual verification support
            $table->timestamp('created_at')->useCurrent();
        });

        // ----------------------------------------------------------------------------
        // 3. PAQUETE: GESTIÓN DE GRUPOS Y PLANIFICACIÓN HORARIA
        // ----------------------------------------------------------------------------

        // Tabla de Materias
        Schema::create('materias', function (Blueprint $table) {
            $table->id(); // SERIAL PRIMARY KEY
            $table->string('nombre', 50)->unique();
        });

        // Tabla de Grupos
        Schema::create('grupos', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->string('sigla', 10);
            $table->foreignId('materia_id')->constrained('materias')->onDelete('restrict');
            $table->foreignId('docente_id')->nullable()->constrained('docentes', 'usuario_id')->onDelete('set null');
            $table->string('turno', 15);
            $table->integer('cupo_maximo')->default(70);
            
            $table->unique(['sigla', 'materia_id']);
        });

        // Tabla Intermedia: Lista de Alumnos por Grupo
        Schema::create('grupo_estudiante', function (Blueprint $table) {
            $table->foreignId('grupo_id')->constrained('grupos')->onDelete('cascade');
            $table->foreignId('estudiante_id')->constrained('estudiantes', 'usuario_id')->onDelete('cascade');
            $table->primary(['grupo_id', 'estudiante_id']);
        });

        // ----------------------------------------------------------------------------
        // 4. PAQUETE: GESTIÓN ACADÉMICA
        // ----------------------------------------------------------------------------

        // Tabla de Control de Asistencias
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->foreignId('estudiante_id')->constrained('estudiantes', 'usuario_id')->onDelete('cascade');
            $table->foreignId('grupo_id')->constrained('grupos')->onDelete('cascade');
            $table->date('fecha')->useCurrent();
            $table->string('estado', 10);

            $table->unique(['estudiante_id', 'grupo_id', 'fecha']);
        });

        // Tabla de Notas y Calificaciones
        Schema::create('notas', function (Blueprint $table) {
            $table->id(); // BIGSERIAL PRIMARY KEY
            $table->foreignId('estudiante_id')->constrained('estudiantes', 'usuario_id')->onDelete('cascade');
            $table->foreignId('materia_id')->constrained('materias')->onDelete('restrict');
            $table->decimal('nota_parcial_1', 5, 2)->default(0.00);
            $table->decimal('nota_parcial_2', 5, 2)->default(0.00);
            $table->decimal('nota_examen_final', 5, 2)->default(0.00);
            $table->decimal('nota_final_materia', 5, 2)->default(0.00);

            $table->unique(['estudiante_id', 'materia_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notas');
        Schema::dropIfExists('asistencias');
        Schema::dropIfExists('grupo_estudiante');
        Schema::dropIfExists('grupos');
        Schema::dropIfExists('materias');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('docentes');
        Schema::dropIfExists('estudiantes');
        Schema::dropIfExists('carreras');
        Schema::dropIfExists('bitacoras');
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('permisos');
        Schema::dropIfExists('roles');
    }
};
