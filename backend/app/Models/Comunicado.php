<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comunicado extends Model
{
    protected $fillable = [
        'titulo',
        'descricao',
        'sala_id',
        'usuario_id',
    ];

    public function sala()
    {
        return $this->belongsTo(Sala::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
}
