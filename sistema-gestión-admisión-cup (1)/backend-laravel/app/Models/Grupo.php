<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grupo extends Model
{
    protected $table = 'grupos';
    
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'sigla',
        'materia_id',
        'docente_id',
        'turno',
        'modulo',
        'aula',
        'hora_inicio',
        'hora_fin',
        'cupo_maximo'
    ];

    protected $casts = [
        'materia_id' => 'integer',
        'cupo_maximo' => 'integer'
    ];

    public function materia()
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id', 'id');
    }

    public function estudiantes()
    {
        return $this->belongsToMany(Estudiante::class, 'grupo_estudiante', 'grupo_id', 'estudiante_id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'grupo_id', 'id');
    }
}
