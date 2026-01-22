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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained();
            $table->string('order_number', 50)->unique();
            $table->enum('type', ['phone_number', 'smm']);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded'])->default('pending');
            $table->decimal('amount_paid', 10, 2);
            $table->enum('provider', ['5sim', 'peakerr']);
            $table->string('provider_order_id', 100)->nullable();

            // Phone number fields
            $table->string('phone_number', 20)->nullable();
            $table->string('sms_code', 10)->nullable();
            $table->text('sms_text')->nullable();

            // SMM fields
            $table->string('smm_link', 255)->nullable();
            $table->integer('smm_quantity')->nullable();
            $table->integer('smm_start_count')->nullable();
            $table->integer('smm_remains')->nullable();

            // Common
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
            $table->index('provider_order_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
