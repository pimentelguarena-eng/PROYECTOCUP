<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $table = 'asistencias';
    
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'estudiante_id',
        'grupo_id',
        'fecha',
        'estado'
    ];

    protected $casts = [
        'fecha' => 'date'
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'estudiante_id', 'usuario_id');
    }

    public function grupo()
    {
        return $this->belongsTo(Grupo::class, 'grupo_id', 'id');
    }
}
