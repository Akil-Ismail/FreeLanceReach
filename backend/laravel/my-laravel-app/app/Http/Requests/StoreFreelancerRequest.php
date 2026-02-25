<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFreelancerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'freelance_category' => 'required|string',
            'professional_bio' => 'required|string|min:50',
            'cv' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
