<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'role',
        'email',
        'password',
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
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    public function isCompany(): bool
    {
        return $this->role === 'company';
    }

    public function isFreelancer(): bool
    {
        return $this->role === 'freelancer';
    }
}
