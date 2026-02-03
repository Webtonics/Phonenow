<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $deleted = DB::table('transactions')
        ->where('status', 'pending')
        ->where('payment_method', 'flutterwave')
        ->delete();

    echo "✅ Deleted {$deleted} pending Flutterwave transaction(s)\n";

    $remaining = DB::table('transactions')
        ->where('status', 'pending')
        ->count();

    echo "📊 Remaining pending transactions: {$remaining}\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
