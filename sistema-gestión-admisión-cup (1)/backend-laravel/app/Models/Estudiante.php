<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    protected $table = 'estudiantes';
    
    protected $primaryKey = 'usuario_id';
    public $incrementing = false; // Primary key is foreign key (User.id)
    protected $keyType = 'int';

    public $timestamps = false; // No default structural timestamps required here

    protected $fillable = [
        'usuario_id',
        'carrera_opcion_1',
        'carrera_opcion_2',
        'turno_preferido',
        'nro_intentos',
        'estado_cup',
        'colegio_procedencia',
        'ciudad',
        'celular',
        'direccion',
        'fecha_nacimiento',
        'sexo',
        'titulo_bachiller',
        'otros_documentos'
    ];

    protected $casts = [
        'titulo_bachiller' => 'boolean',
        'carrera_opcion_1' => 'integer',
        'carrera_opcion_2' => 'integer',
        'nro_intentos' => 'integer',
        'fecha_nacimiento' => 'date'
    ];

    // Relationships
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    public function carreraOpcion1()
    {
        return $this->belongsTo(Carrera::class, 'carrera_opcion_1');
    }

    public function carreraOpcion2()
    {
        return $this->belongsTo(Carrera::class, 'carrera_opcion_2');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class, 'estudiante_id', 'usuario_id');
    }

    public function grupos()
    {
        return $this->belongsToMany(Grupo::class, 'grupo_estudiante', 'estudiante_id', 'grupo_id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'estudiante_id', 'usuario_id');
    }

    public function notas()
    {
        return $this->hasMany(Nota::class, 'estudiante_id', 'usuario_id');
    }
}
