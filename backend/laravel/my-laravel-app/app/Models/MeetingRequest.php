<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MeetingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_match_id',
        'company_user_id',
        'freelancer_user_id',
        'proposed_at',
        'freelancer_proposed_at',
        'status',
        'google_meet_link',
        'notes',
    ];

    protected $casts = [
        'proposed_at' => 'datetime',
        'freelancer_proposed_at' => 'datetime',
    ];

    public function proposalMatch(): BelongsTo
    {
        return $this->belongsTo(ProposalMatch::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_user_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_user_id');
    }

    public function decision(): HasOne
    {
        return $this->hasOne(ServiceDecision::class);
    }
}
