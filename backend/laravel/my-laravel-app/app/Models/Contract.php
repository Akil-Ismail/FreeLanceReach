<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_match_id',
        'company_user_id',
        'freelancer_user_id',
        'details',
        'contract_text',
        'status',
        'employer_signature',
        'freelancer_signature',
    ];

    protected $casts = [
        'details' => 'array',
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

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
