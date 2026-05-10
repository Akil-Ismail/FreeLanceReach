<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_request_id')->constrained('meeting_requests')->cascadeOnDelete();
            $table->foreignId('company_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('freelancer_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('decision', ['approved', 'denied']);
            $table->text('feedback')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_decisions');
    }
};
