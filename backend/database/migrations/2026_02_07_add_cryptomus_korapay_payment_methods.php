<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add cryptomus and korapay to payment_method enum
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('flutterwave', 'admin_credit', 'refund', 'wallet', 'cryptomus', 'korapay') NULL");

        // Add cryptomus_ref column
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('cryptomus_ref', 100)->unique()->nullable()->after('flutterwave_ref');
            $table->string('korapay_ref', 100)->unique()->nullable()->after('cryptomus_ref');

            // Add indexes for performance
            $table->index('cryptomus_ref');
            $table->index('korapay_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new columns
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['cryptomus_ref']);
            $table->dropIndex(['korapay_ref']);
            $table->dropColumn(['cryptomus_ref', 'korapay_ref']);
        });

        // Restore original enum
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('flutterwave', 'admin_credit', 'refund', 'wallet') NULL");
    }
};
