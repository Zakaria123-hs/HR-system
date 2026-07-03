<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QrCode extends Model
{
    use HasFactory;

    protected $table = 'qr_codes';

    protected $fillable = [
        'token',
        'expires_at',
        'is_active'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Local scope helper to quickly check if a QR token is still valid.
     */
    public function scopeIsValid($query)
    {
        return $query->where('is_active', true)
                     ->where('expires_at', '>', Carbon::now());
    }
}