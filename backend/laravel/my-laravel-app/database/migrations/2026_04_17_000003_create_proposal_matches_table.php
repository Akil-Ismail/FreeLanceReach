<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('proposal_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('proposals')->cascadeOnDelete();
            $table->foreignId('freelancer_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('match_score', 8, 4)->default(0);
            $table->string('model_source')->default('bert');
            $table->enum('status', ['pending', 'company_approved', 'freelancer_approved', 'mutual_approved', 'rejected'])->default('pending');
            $table->timestamps();

            $table->unique(['proposal_id', 'freelancer_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_matches');
    }
};
