<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nota extends Model
{
    protected $table = 'notas';
    
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'estudiante_id',
        'materia_id',
        'nota_parcial_1',
        'nota_parcial_2',
        'nota_examen_final',
        'nota_final_materia'
    ];

    protected $casts = [
        'materia_id' => 'integer',
        'nota_parcial_1' => 'float',
        'nota_parcial_2' => 'float',
        'nota_examen_final' => 'float',
        'nota_final_materia' => 'float'
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'estudiante_id', 'usuario_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }
}
