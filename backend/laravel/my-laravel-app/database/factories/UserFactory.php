<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'email' => $this->faker->unique()->safeEmail(),
            'password' => 'password123',
            'phone_number' => $this->faker->phoneNumber(),
        ];
    }

    public function company(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => 'company',
            'company_name' => $this->faker->company(),
            'contact_first_name' => $this->faker->firstName(),
            'contact_last_name' => $this->faker->lastName(),
            'work_email' => $this->faker->companyEmail(),
            'company_website' => $this->faker->url(),
            'company_size' => $this->faker->randomElement(['1-10', '11-50', '51-200', '201-500', '500+']),
            'industry' => $this->faker->randomElement(['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing']),
            'company_description' => $this->faker->paragraph(),
        ]);
    }

    public function freelancer(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => 'freelancer',
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'freelance_category' => $this->faker->randomElement(['Web Development', 'Graphic Design', 'Writing', 'Marketing', 'Video Editing']),
            'professional_bio' => $this->faker->paragraph(3),
        ]);
    }
}
