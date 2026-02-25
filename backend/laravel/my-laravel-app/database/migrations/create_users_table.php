<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['company', 'freelancer']);

            // Common fields
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone_number');

            // Company-specific fields (nullable for freelancers)
            $table->string('company_name')->nullable();
            $table->string('contact_first_name')->nullable();
            $table->string('contact_last_name')->nullable();
            $table->string('work_email')->nullable();
            $table->string('company_website')->nullable();
            $table->string('company_size')->nullable();
            $table->string('industry')->nullable();
            $table->text('company_description')->nullable();

            // Freelancer-specific fields (nullable for companies)
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('freelance_category')->nullable();
            $table->text('professional_bio')->nullable();
            $table->string('cv_path')->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}
