<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    protected $table = 'permisos';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion'
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'rol_permiso', 'permiso_id', 'rol_id');
    }
}
