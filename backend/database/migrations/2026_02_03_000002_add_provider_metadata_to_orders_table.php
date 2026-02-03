<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Store provider-specific data that doesn't fit standard columns
            $table->json('provider_metadata')->nullable()->after('provider_order_id');

            // Add operator column for phone numbers (some providers return this)
            $table->string('operator', 50)->nullable()->after('country_code');

            // Add index for provider lookups
            $table->index('provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['provider']);
            $table->dropColumn(['provider_metadata', 'operator']);
        });
    }
};
