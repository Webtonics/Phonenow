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
        Schema::create('esim_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('esim_profile_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Package information
            $table->string('package_code')->index();
            $table->string('order_no')->unique()->nullable();

            // Data bundle details
            $table->decimal('data_amount', 10, 2); // in MB
            $table->integer('duration_days');
            $table->decimal('data_used', 10, 2)->default(0); // in MB
            $table->decimal('data_remaining', 10, 2); // in MB

            // Pricing
            $table->decimal('wholesale_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('profit', 10, 2);

            // Status tracking
            $table->enum('status', ['active', 'expired'])->default('active');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_usage_check')->nullable();

            // Transaction reference
            $table->string('transaction_reference')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['esim_profile_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esim_subscriptions');
    }
};
