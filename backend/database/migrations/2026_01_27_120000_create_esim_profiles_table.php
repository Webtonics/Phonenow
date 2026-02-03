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
        Schema::create('esim_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // eSIM Access API data
            $table->string('order_no')->unique()->index();
            $table->string('iccid')->unique()->index();
            $table->text('qr_code_data'); // LPA string
            $table->string('qr_code_url')->nullable(); // Short URL from API
            $table->string('qr_code_image')->nullable(); // Local QR image path

            // Package information
            $table->string('package_code')->index();
            $table->string('country_code', 2);
            $table->string('country_name');
            $table->decimal('data_amount', 10, 2)->default(0); // in MB
            $table->integer('duration_days')->default(0);

            // Pricing
            $table->decimal('wholesale_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('profit', 10, 2);

            // Status tracking
            $table->enum('status', ['new', 'active', 'expired', 'cancelled'])->default('new');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // Transaction reference
            $table->string('transaction_reference')->nullable();

            // Metadata
            $table->string('device_info')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index(['user_id', 'status']);
            $table->index(['country_code', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esim_profiles');
    }
};
