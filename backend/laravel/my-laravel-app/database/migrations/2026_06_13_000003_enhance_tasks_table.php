<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Change status from enum to varchar so any column name is valid
        DB::statement("ALTER TABLE tasks MODIFY status VARCHAR(100) NOT NULL DEFAULT 'todo'");

        Schema::table('tasks', function (Blueprint $table) {
            $table->longText('notes')->nullable()->after('description');
            $table->json('attachments')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['notes', 'attachments']);
        });
        DB::statement("ALTER TABLE tasks MODIFY status ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo'");
    }
};
