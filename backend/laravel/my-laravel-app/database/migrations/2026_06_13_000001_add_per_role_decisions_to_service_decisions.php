<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_decisions', function (Blueprint $table) {
            $table->enum('company_decision',    ['approved', 'denied'])->nullable()->after('decision');
            $table->enum('freelancer_decision', ['approved', 'denied'])->nullable()->after('company_decision');
        });
    }

    public function down(): void
    {
        Schema::table('service_decisions', function (Blueprint $table) {
            $table->dropColumn(['company_decision', 'freelancer_decision']);
        });
    }
};
