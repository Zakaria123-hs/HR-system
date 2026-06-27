<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    protected $fillable = ['user_id', 'leave_type_id', 'year', 'initial_days', 'used_days'];

    protected $appends = ['remaining_days'];

    public function getRemainingDaysAttribute(): int
    {
        return $this->initial_days - $this->used_days;
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }
}
