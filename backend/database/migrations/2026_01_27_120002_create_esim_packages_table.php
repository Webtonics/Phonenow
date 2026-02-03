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
        Schema::create('esim_packages', function (Blueprint $table) {
            $table->id();

            // Package identification
            $table->string('package_code')->unique();
            $table->string('country_code', 2)->index();
            $table->string('country_name');
            $table->string('region')->nullable(); // e.g., "Europe", "Asia", "Global"

            // Package details
            $table->decimal('data_amount', 10, 2); // in MB
            $table->integer('duration_days');
            $table->string('network_type')->default('4G/5G'); // 3G, 4G, 5G, etc.

            // Pricing
            $table->decimal('wholesale_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('markup_percentage', 5, 2)->default(100); // 100%

            // Package type
            $table->enum('package_type', ['profile', 'topup'])->default('topup');
            // profile = initial eSIM purchase, topup = data bundle only

            // Popularity tracking
            $table->integer('purchase_count')->default(0);
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);

            // API sync tracking
            $table->timestamp('last_synced_at')->nullable();

            $table->timestamps();

            // Indexes for filtering
            $table->index(['country_code', 'is_active']);
            $table->index(['region', 'is_active']);
            $table->index(['package_type', 'is_active']);
            $table->index('is_popular');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esim_packages');
    }
};
