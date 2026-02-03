<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Expand provider enum to include grizzlysms
        DB::statement("ALTER TABLE orders MODIFY COLUMN provider ENUM('5sim', 'peakerr', 'grizzlysms') NOT NULL DEFAULT '5sim'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE orders MODIFY COLUMN provider ENUM('5sim', 'peakerr') NOT NULL DEFAULT '5sim'");
    }
};
