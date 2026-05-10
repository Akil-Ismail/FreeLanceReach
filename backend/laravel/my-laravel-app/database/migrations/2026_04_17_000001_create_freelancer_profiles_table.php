<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('freelancer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('headline')->nullable();
            $table->json('skills')->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->string('experience_level')->nullable();
            $table->text('bio')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('availability')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freelancer_profiles');
    }
};
