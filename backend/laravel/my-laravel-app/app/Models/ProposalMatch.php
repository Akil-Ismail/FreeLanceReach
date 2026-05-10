<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProposalMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_id',
        'freelancer_user_id',
        'match_score',
        'model_source',
        'status',
    ];

    protected $casts = [
        'match_score' => 'decimal:4',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_user_id');
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(MeetingRequest::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
