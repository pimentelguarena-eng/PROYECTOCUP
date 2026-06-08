<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    protected $table = 'docentes';
    
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;
    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'especialidad'
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    public function grupos()
    {
        return $this->hasMany(Grupo::class, 'docente_id', 'usuario_id');
    }
}
