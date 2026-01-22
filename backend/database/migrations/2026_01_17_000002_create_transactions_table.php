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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->text('description')->nullable();
            $table->string('reference', 100)->unique()->nullable();
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->enum('payment_method', ['flutterwave', 'admin_credit', 'refund'])->nullable();
            $table->string('flutterwave_ref', 100)->unique()->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('created_at');
            $table->index('status');
            $table->index('reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
