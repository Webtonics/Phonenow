<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\ReferralCode;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateReferralCodes extends Command
{
    protected $signature = 'referral:generate-codes';
    protected $description = 'Generate referral codes for existing users who don\'t have one';

    public function handle()
    {
        $this->info('Generating referral codes for existing users...');

        $usersWithoutCodes = User::whereNull('referral_code')->get();

        if ($usersWithoutCodes->isEmpty()) {
            $this->info('All users already have referral codes!');
            return 0;
        }

        $bar = $this->output->createProgressBar($usersWithoutCodes->count());
        $bar->start();

        foreach ($usersWithoutCodes as $user) {
            // Generate unique code
            do {
                $code = strtoupper(Str::random(8));
            } while (User::where('referral_code', $code)->exists());

            // Update user
            $user->update(['referral_code' => $code]);

            // Create referral code record
            ReferralCode::create([
                'user_id' => $user->id,
                'code' => $code,
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully generated {$usersWithoutCodes->count()} referral codes!");

        return 0;
    }
}
