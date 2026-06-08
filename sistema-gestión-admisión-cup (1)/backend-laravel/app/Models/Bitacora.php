<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bitacora extends Model
{
    protected $table = 'bitacoras';
    
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'accion',
        'modulo',
        'ip_address'
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }
}
