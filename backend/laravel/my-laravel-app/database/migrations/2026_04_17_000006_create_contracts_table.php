<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_match_id')->constrained('proposal_matches')->cascadeOnDelete();
            $table->foreignId('company_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('freelancer_user_id')->constrained('users')->cascadeOnDelete();
            $table->json('details')->nullable();
            $table->longText('contract_text')->nullable();
            $table->enum('status', ['draft', 'company_signed', 'freelancer_signed', 'active', 'rejected'])->default('draft');
            $table->text('employer_signature')->nullable();
            $table->text('freelancer_signature')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
