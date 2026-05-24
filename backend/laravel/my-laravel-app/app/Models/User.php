<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'role',
        'email',
        'password',
        'api_token',
        'phone_number',
        // Company fields
        'company_name',
        'contact_first_name',
        'contact_last_name',
        'work_email',
        'company_website',
        'company_size',
        'industry',
        'company_description',
        // Freelancer fields
        'first_name',
        'last_name',
        'freelance_category',
        'professional_bio',
        'cv_path',
        'profile_picture_path',
        'cover_photo_path',
    ];

    protected $hidden = [
        'password',
        'api_token',
    ];

    protected $casts = [];

    /**
     * Hash password automatically when setting it.
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

    public function isCompany(): bool
    {
        return $this->role === 'company';
    }

    public function isFreelancer(): bool
    {
        return $this->role === 'freelancer';
    }

    public function freelancerProfile(): HasOne
    {
        return $this->hasOne(FreelancerProfile::class);
    }

    public function companyProposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'company_user_id');
    }

    public function freelancerMatches(): HasMany
    {
        return $this->hasMany(ProposalMatch::class, 'freelancer_user_id');
    }

    public function companyMeetings(): HasMany
    {
        return $this->hasMany(MeetingRequest::class, 'company_user_id');
    }

    public function freelancerMeetings(): HasMany
    {
        return $this->hasMany(MeetingRequest::class, 'freelancer_user_id');
    }

    public function companyContracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'company_user_id');
    }

    public function freelancerContracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'freelancer_user_id');
    }
}
