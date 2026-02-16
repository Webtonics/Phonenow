<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('vpn');
            $table->integer('duration_days');
            $table->string('duration_label');
            $table->decimal('wholesale_cost', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->integer('stock_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('shop_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('shop_products');
            $table->foreignId('transaction_id')->nullable()->constrained();
            $table->string('reference')->unique();
            $table->decimal('amount_paid', 10, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->enum('status', ['pending', 'fulfilled', 'cancelled', 'refunded'])->default('pending');
            $table->text('activation_code')->nullable();
            $table->text('activation_instructions')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('reference');
        });

        Schema::create('shop_product_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('shop_products')->cascadeOnDelete();
            $table->text('activation_code');
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->foreignId('order_id')->nullable()->constrained('shop_orders');
            $table->timestamps();

            $table->index(['product_id', 'is_used']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_product_stock');
        Schema::dropIfExists('shop_orders');
        Schema::dropIfExists('shop_products');
    }
};
