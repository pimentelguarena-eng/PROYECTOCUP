<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $table = 'materias';
    public $timestamps = false;

    protected $fillable = [
        'nombre'
    ];

    public function grupos()
    {
        return $this->hasMany(Grupo::class, 'materia_id');
    }

    public function notas()
    {
        return $this->hasMany(Nota::class, 'materia_id');
    }
}
