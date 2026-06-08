<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    
    protected $primaryKey = 'id';
    public $timestamps = false; // Script defaults: created_at managed manually or default behavior

    protected $fillable = [
        'estudiante_id',
        'monto',
        'nro_factura',
        'estado_pago',
        'fecha_pago',
        'comprobante_url'
    ];

    protected $casts = [
        'monto' => 'float',
        'fecha_pago' => 'datetime'
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'estudiante_id', 'usuario_id');
    }
}
