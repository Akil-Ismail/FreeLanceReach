<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'contact_first_name' => 'required|string|max:255',
            'contact_last_name' => 'required|string|max:255',
            'work_email' => 'required|email|unique:users,work_email',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'company_website' => 'nullable|url',
            'company_size' => 'required|string',
            'industry' => 'required|string',
            'company_description' => 'required|string|min:20',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
