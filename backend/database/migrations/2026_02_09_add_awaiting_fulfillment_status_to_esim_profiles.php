<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `esim_profiles` MODIFY `status` ENUM('new', 'pending', 'processing', 'active', 'failed', 'expired', 'cancelled', 'awaiting_fulfillment') NOT NULL DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement("UPDATE `esim_profiles` SET `status` = 'pending' WHERE `status` = 'awaiting_fulfillment'");
        DB::statement("ALTER TABLE `esim_profiles` MODIFY `status` ENUM('new', 'pending', 'processing', 'active', 'failed', 'expired', 'cancelled') NOT NULL DEFAULT 'new'");
    }
};
