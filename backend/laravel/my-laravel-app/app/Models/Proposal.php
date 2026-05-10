<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_user_id',
        'title',
        'description',
        'required_skills',
        'budget_min',
        'budget_max',
        'timeline',
        'status',
        'ai_notes',
    ];

    protected $casts = [
        'required_skills' => 'array',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_user_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ProposalMatch::class);
    }
}
