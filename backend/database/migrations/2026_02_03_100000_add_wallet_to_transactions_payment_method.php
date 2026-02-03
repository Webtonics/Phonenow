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
        // Add 'wallet' to the payment_method enum
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('flutterwave', 'admin_credit', 'refund', 'wallet') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'wallet' from the payment_method enum
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('flutterwave', 'admin_credit', 'refund') NULL");
    }
};
