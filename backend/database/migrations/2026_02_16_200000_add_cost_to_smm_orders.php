<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('smm_orders', 'cost')) {
            Schema::table('smm_orders', function (Blueprint $table) {
                $table->decimal('cost', 10, 4)->default(0)->after('amount');
            });
        }
    }

    public function down(): void
    {
        Schema::table('smm_orders', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }
};
