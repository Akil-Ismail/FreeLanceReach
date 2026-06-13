<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE contracts MODIFY status ENUM('draft','company_signed','freelancer_signed','active','rejected','completed') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE contracts MODIFY status ENUM('draft','company_signed','freelancer_signed','active','rejected') NOT NULL DEFAULT 'draft'");
    }
};
