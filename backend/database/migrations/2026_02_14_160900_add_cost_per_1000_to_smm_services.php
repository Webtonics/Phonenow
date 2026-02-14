<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('smm_services', function (Blueprint $table) {
            // Add cost_per_1000 column if it doesn't exist
            if (!Schema::hasColumn('smm_services', 'cost_per_1000')) {
                $table->decimal('cost_per_1000', 10, 4)->after('type');
            }

            // Also ensure price_per_1000 exists and has correct precision
            if (!Schema::hasColumn('smm_services', 'price_per_1000')) {
                $table->decimal('price_per_1000', 10, 2)->after('cost_per_1000');
            }
        });
    }

    public function down(): void
    {
        Schema::table('smm_services', function (Blueprint $table) {
            if (Schema::hasColumn('smm_services', 'cost_per_1000')) {
                $table->dropColumn('cost_per_1000');
            }
            if (Schema::hasColumn('smm_services', 'price_per_1000')) {
                $table->dropColumn('price_per_1000');
            }
        });
    }
};
