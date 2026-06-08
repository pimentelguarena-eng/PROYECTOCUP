<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carrera extends Model
{
    protected $table = 'carreras';
    public $timestamps = false;

    protected $fillable = [
        'nombre'
    ];

    public function estudiantesOpcion1()
    {
        return $this->hasMany(Estudiante::class, 'carrera_opcion_1');
    }

    public function estudiantesOpcion2()
    {
        return $this->hasMany(Estudiante::class, 'carrera_opcion_2');
    }
}
