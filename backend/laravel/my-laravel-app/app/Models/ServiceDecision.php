<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_request_id',
        'company_user_id',
        'freelancer_user_id',
        'decision',
        'company_decision',
        'freelancer_decision',
        'feedback',
    ];

    public function meetingRequest(): BelongsTo
    {
        return $this->belongsTo(MeetingRequest::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_user_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_user_id');
    }
}
