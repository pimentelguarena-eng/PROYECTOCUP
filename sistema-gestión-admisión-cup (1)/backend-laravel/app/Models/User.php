<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'codigo_registro',
        'ci',
        'nombre_completo',
        'email',
        'password',
        'rol_id',
        'estado'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'password' => 'hashed',
    ];

    // Relationships
    public function rol()
    {
        return $this->belongsTo(Role::class, 'rol_id');
    }

    public function estudiante()
    {
        return $this->hasOne(Estudiante::class, 'usuario_id', 'id');
    }

    public function docente()
    {
        return $this->hasOne(Docente::class, 'usuario_id', 'id');
    }

    public function bitacoras()
    {
        return $this->hasMany(Bitacora::class, 'usuario_id', 'id');
    }

    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'estudiante_id', 'id');
    }

    public function notas()
    {
        return $this->hasMany(Nota::class, 'estudiante_id', 'id');
    }

    /**
     * Helper to get role name directly (e.g. 'Administrador', 'Docente', 'Estudiante')
     */
    public function getRolNombreAttribute()
    {
        return $this->rol ? $this->rol->nombre : null;
    }
}
