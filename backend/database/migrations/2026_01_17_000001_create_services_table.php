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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['phone_number', 'smm']);
            $table->string('name');
            $table->enum('provider', ['5sim', 'peakerr']);
            $table->string('provider_service_code', 100);
            $table->decimal('cost_price', 10, 2);
            $table->decimal('retail_price', 10, 2);
            $table->decimal('reseller_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
            $table->index('provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
