<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'awaiting_fulfillment' to the status enum
        DB::statement("ALTER TABLE smm_orders MODIFY COLUMN status ENUM('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded', 'failed', 'awaiting_fulfillment') DEFAULT 'pending'");

        // Add admin_notes column for fulfillment/rejection notes
        if (!Schema::hasColumn('smm_orders', 'admin_notes')) {
            Schema::table('smm_orders', function ($table) {
                $table->text('admin_notes')->nullable();
                $table->timestamp('fulfilled_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE smm_orders MODIFY COLUMN status ENUM('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded', 'failed') DEFAULT 'pending'");

        Schema::table('smm_orders', function ($table) {
            $table->dropColumn(['admin_notes', 'fulfilled_at']);
        });
    }
};
