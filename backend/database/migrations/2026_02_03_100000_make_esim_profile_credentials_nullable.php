<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Makes eSIM profile credentials nullable because:
     * - Zendit returns ACCEPTED status before credentials are ready
     * - Credentials (iccid, qr_code_data) arrive via webhook or later polling
     * - We need to create the profile record immediately to track the transaction
     */
    public function up(): void
    {
        // Use raw SQL to modify columns - more reliable across different MySQL configurations
        // This handles the case where indexes may or may not exist with various names

        // First, drop any existing unique/index constraints on iccid
        $this->dropIndexIfExists('esim_profiles', 'iccid');

        // Make iccid nullable
        DB::statement('ALTER TABLE `esim_profiles` MODIFY `iccid` VARCHAR(255) NULL');

        // Make qr_code_data nullable
        DB::statement('ALTER TABLE `esim_profiles` MODIFY `qr_code_data` TEXT NULL');

        // Re-add unique index on iccid (allows nulls - MySQL unique allows multiple nulls)
        Schema::table('esim_profiles', function (Blueprint $table) {
            $table->unique('iccid', 'esim_profiles_iccid_unique');
        });
    }

    /**
     * Drop index if it exists (handles various naming conventions)
     */
    protected function dropIndexIfExists(string $table, string $column): void
    {
        $existingIndexes = collect(DB::select("SHOW INDEX FROM `{$table}` WHERE Column_name = ?", [$column]))
            ->pluck('Key_name')
            ->unique()
            ->toArray();

        foreach ($existingIndexes as $indexName) {
            try {
                // PRIMARY key cannot be dropped this way
                if ($indexName === 'PRIMARY') {
                    continue;
                }
                DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$indexName}`");
            } catch (\Exception) {
                // Index might have been dropped already, continue
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the unique constraint first
        Schema::table('esim_profiles', function (Blueprint $table) {
            $table->dropUnique('esim_profiles_iccid_unique');
        });

        // Note: This will fail if there are null values in the columns
        DB::statement('ALTER TABLE `esim_profiles` MODIFY `iccid` VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE `esim_profiles` MODIFY `qr_code_data` TEXT NOT NULL');

        // Re-add constraints
        Schema::table('esim_profiles', function (Blueprint $table) {
            $table->unique('iccid');
        });
    }
};
