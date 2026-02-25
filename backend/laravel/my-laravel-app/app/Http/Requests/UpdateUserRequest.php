<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($userId)],
            'phone_number' => 'sometimes|string|max:20',
            'company_name' => 'sometimes|string|max:255',
            'contact_first_name' => 'sometimes|string|max:255',
            'contact_last_name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'freelance_category' => 'sometimes|string',
            'professional_bio' => 'sometimes|string|min:50',
            'company_description' => 'sometimes|string|min:20',
        ];
    }
}
