<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Updates the status enum to include all Zendit-mapped statuses:
     * - new: Initial state
     * - pending: Waiting for Zendit to process (ACCEPTED, PENDING, AUTHORIZED)
     * - processing: Zendit is actively processing (IN_PROGRESS)
     * - active: eSIM is ready to use (DONE)
     * - failed: Purchase failed (FAILED)
     * - expired: eSIM validity period ended
     * - cancelled: User cancelled / refunded
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `esim_profiles` MODIFY `status` ENUM('new', 'pending', 'processing', 'active', 'failed', 'expired', 'cancelled') NOT NULL DEFAULT 'new'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This will fail if there are rows with pending/processing/failed status
        DB::statement("ALTER TABLE `esim_profiles` MODIFY `status` ENUM('new', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'new'");
    }
};
