<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 20)->unique()->nullable()->after('email');
            $table->string('referred_by_code', 20)->nullable()->after('referral_code');
            $table->boolean('signup_bonus_claimed')->default(false)->after('referred_by_code');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['referral_code', 'referred_by_code', 'signup_bonus_claimed']);
        });
    }
};
