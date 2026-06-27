<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    protected $fillable = ['user_id', 'document_id', 'reason', 'status', 'rejection_reason'];

    public function user()     { return $this->belongsTo(User::class); }
    public function document() { return $this->belongsTo(Document::class); }
}
