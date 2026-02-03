<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates eSIM tables for Zendit API compatibility
     */
    public function up(): void
    {
        // Update esim_packages table for Zendit offer structure
        Schema::table('esim_packages', function (Blueprint $table) {
            // Zendit uses 'offerId' instead of 'package_code'
            $table->string('offer_id')->nullable()->after('id');
            $table->string('brand')->nullable()->after('offer_id');

            // Data can be in GB or unlimited
            $table->decimal('data_gb', 10, 4)->nullable()->after('data_amount');
            $table->boolean('data_unlimited')->default(false)->after('data_gb');

            // Voice minutes support
            $table->integer('voice_minutes')->nullable()->after('data_unlimited');
            $table->boolean('voice_unlimited')->default(false)->after('voice_minutes');

            // SMS support
            $table->integer('sms_number')->nullable()->after('voice_unlimited');
            $table->boolean('sms_unlimited')->default(false)->after('sms_number');

            // Roaming and coverage info
            $table->json('roaming_countries')->nullable()->after('sms_unlimited');
            $table->json('data_speeds')->nullable()->after('roaming_countries'); // ["4G", "5G"]

            // Zendit specific fields
            $table->string('price_type')->nullable()->after('data_speeds');
            $table->string('product_type')->nullable()->after('price_type');
            $table->json('regions')->nullable()->after('product_type'); // Multi-region support

            // Price in original currency (USD from Zendit)
            $table->decimal('price_usd', 10, 4)->nullable()->after('wholesale_price');
            $table->string('price_currency', 3)->default('USD')->after('price_usd');

            // Provider tracking
            $table->string('provider')->default('zendit')->after('package_type');

            // Add index for offer_id
            $table->index('offer_id');
        });

        // Update esim_profiles table for Zendit purchase response
        Schema::table('esim_profiles', function (Blueprint $table) {
            // Zendit transaction ID (our reference)
            $table->string('zendit_transaction_id')->nullable()->after('order_no');

            // Zendit confirmation data
            $table->string('smdp_address')->nullable()->after('qr_code_image');
            $table->string('activation_code')->nullable()->after('smdp_address');
            $table->string('external_reference_id')->nullable()->after('activation_code');

            // Store original Zendit status
            $table->string('zendit_status')->nullable()->after('status');

            // Zendit offer reference
            $table->string('offer_id')->nullable()->after('package_code');

            // Additional Zendit fields
            $table->decimal('cost_usd', 10, 4)->nullable()->after('wholesale_price');
            $table->decimal('price_usd', 10, 4)->nullable()->after('cost_usd');

            // Voice and SMS included
            $table->integer('voice_minutes')->nullable()->after('duration_days');
            $table->boolean('voice_unlimited')->default(false)->after('voice_minutes');
            $table->integer('sms_number')->nullable()->after('voice_unlimited');
            $table->boolean('sms_unlimited')->default(false)->after('sms_number');

            // Redemption instructions
            $table->text('redemption_instructions')->nullable()->after('notes');

            // Indexes
            $table->index('zendit_transaction_id');
            $table->index('offer_id');
        });

        // Update esim_subscriptions table for Zendit topup support
        Schema::table('esim_subscriptions', function (Blueprint $table) {
            $table->string('zendit_transaction_id')->nullable()->after('id');
            $table->string('offer_id')->nullable()->after('package_code');
            $table->decimal('cost_usd', 10, 4)->nullable()->after('wholesale_price');
            $table->decimal('price_usd', 10, 4)->nullable()->after('cost_usd');
            $table->string('zendit_status')->nullable()->after('status');

            $table->index('zendit_transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('esim_packages', function (Blueprint $table) {
            $table->dropIndex(['offer_id']);
            $table->dropColumn([
                'offer_id',
                'brand',
                'data_gb',
                'data_unlimited',
                'voice_minutes',
                'voice_unlimited',
                'sms_number',
                'sms_unlimited',
                'roaming_countries',
                'data_speeds',
                'price_type',
                'product_type',
                'regions',
                'price_usd',
                'price_currency',
                'provider',
            ]);
        });

        Schema::table('esim_profiles', function (Blueprint $table) {
            $table->dropIndex(['zendit_transaction_id']);
            $table->dropIndex(['offer_id']);
            $table->dropColumn([
                'zendit_transaction_id',
                'smdp_address',
                'activation_code',
                'external_reference_id',
                'zendit_status',
                'offer_id',
                'cost_usd',
                'price_usd',
                'voice_minutes',
                'voice_unlimited',
                'sms_number',
                'sms_unlimited',
                'redemption_instructions',
            ]);
        });

        Schema::table('esim_subscriptions', function (Blueprint $table) {
            $table->dropIndex(['zendit_transaction_id']);
            $table->dropColumn([
                'zendit_transaction_id',
                'offer_id',
                'cost_usd',
                'price_usd',
                'zendit_status',
            ]);
        });
    }
};
