<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('meeting_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_match_id')->constrained('proposal_matches')->cascadeOnDelete();
            $table->foreignId('company_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('freelancer_user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('proposed_at')->nullable();
            $table->dateTime('freelancer_proposed_at')->nullable();
            $table->enum('status', ['pending_freelancer', 'pending_company', 'approved', 'rejected'])->default('pending_freelancer');
            $table->string('google_meet_link')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_requests');
    }
};
