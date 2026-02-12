<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SMM Categories (Instagram, TikTok, YouTube, etc.)
        Schema::create('smm_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Instagram, TikTok, YouTube, Twitter, Facebook
            $table->string('slug')->unique();
            $table->string('icon')->nullable(); // Icon name or path
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // SMM Services (Followers, Likes, Views, etc.)
        Schema::create('smm_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('smm_categories')->cascadeOnDelete();
            $table->string('provider'); // jap, peakerr, etc.
            $table->string('provider_service_id'); // Service ID from the provider
            $table->string('name'); // Instagram Followers [High Quality]
            $table->text('description')->nullable();
            $table->string('type'); // followers, likes, views, comments, etc.

            // Pricing
            $table->decimal('cost_per_1000', 10, 4); // What we pay to provider
            $table->decimal('price_per_1000', 10, 2); // What we charge users
            $table->decimal('min_order', 10, 2)->default(100);
            $table->decimal('max_order', 10, 2)->default(100000);

            // Service details
            $table->integer('average_time_minutes')->nullable(); // Delivery time
            $table->boolean('refill_enabled')->default(false);
            $table->integer('refill_days')->nullable();
            $table->boolean('cancel_enabled')->default(false);

            // Status
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            // Metadata
            $table->json('metadata')->nullable(); // Additional provider-specific data
            $table->timestamp('last_synced_at')->nullable();

            $table->timestamps();

            $table->index(['category_id', 'is_active']);
            $table->index(['provider', 'provider_service_id']);
        });

        // SMM Orders
        Schema::create('smm_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('smm_services');

            // Order details
            $table->string('reference')->unique(); // Our internal reference
            $table->string('provider'); // jap, peakerr
            $table->string('provider_order_id')->nullable(); // Order ID from provider

            // Order info
            $table->string('link'); // Instagram profile URL, TikTok video URL, etc.
            $table->integer('quantity'); // Number of followers/likes/views
            $table->decimal('amount', 10, 2); // Total amount charged to user
            $table->decimal('cost', 10, 4); // Total cost from provider

            // Status
            $table->enum('status', [
                'pending',      // Order created, not yet sent to provider
                'processing',   // Sent to provider, being processed
                'in_progress',  // Provider is delivering
                'completed',    // Order completed successfully
                'partial',      // Partially completed
                'cancelled',    // Order cancelled
                'refunded',     // Order refunded
                'failed'        // Order failed
            ])->default('pending');

            // Delivery tracking
            $table->integer('start_count')->nullable(); // Initial count before order
            $table->integer('remains')->nullable(); // How many left to deliver
            $table->text('status_message')->nullable();

            // Transaction
            $table->foreignId('transaction_id')->nullable()->constrained();
            $table->decimal('balance_before', 15, 2)->nullable();
            $table->decimal('balance_after', 15, 2)->nullable();

            // Timestamps
            $table->timestamp('provider_created_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('reference');
            $table->index(['provider', 'provider_order_id']);
        });

        // SMM Provider Balances (track balance with each provider)
        Schema::create('smm_provider_balances', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->unique(); // jap, peakerr
            $table->decimal('balance', 10, 4)->default(0);
            $table->decimal('currency_rate', 10, 4)->default(1); // USD to NGN rate
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smm_orders');
        Schema::dropIfExists('smm_services');
        Schema::dropIfExists('smm_categories');
        Schema::dropIfExists('smm_provider_balances');
    }
};
