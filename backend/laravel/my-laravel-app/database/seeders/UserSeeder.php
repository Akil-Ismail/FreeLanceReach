<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create 5 companies
        User::factory()->company()->count(5)->create();

        // Create 10 freelancers
        User::factory()->freelancer()->count(10)->create();

        // Create specific test users
        User::factory()->company()->create([
            'email' => 'company@test.com',
            'company_name' => 'Test Company Inc',
        ]);

        User::factory()->freelancer()->create([
            'email' => 'freelancer@test.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
    }
}
