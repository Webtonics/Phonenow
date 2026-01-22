<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PhoneController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
});

// Public test endpoint for debugging 5SIM API
Route::get('/phone/test-5sim', [PhoneController::class, 'test5SIM']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });

    // Wallet routes
    Route::prefix('wallet')->group(function () {
        Route::get('/', [WalletController::class, 'index']);
        Route::get('/transactions', [WalletController::class, 'transactions']);
        Route::get('/transactions/{reference}', [WalletController::class, 'getTransaction']);
        Route::post('/fund', [WalletController::class, 'initializeFunding']);
        Route::post('/verify', [WalletController::class, 'verifyFunding']);
    });

    // Phone number routes
    Route::prefix('phone')->group(function () {
        Route::get('/countries', [PhoneController::class, 'getCountries']);
        Route::get('/services', [PhoneController::class, 'getServices']);
        Route::get('/prices', [PhoneController::class, 'getPrices']);
        Route::post('/buy', [PhoneController::class, 'buyNumber']);
        Route::get('/orders', [PhoneController::class, 'getOrders']);
        Route::get('/orders/{orderId}', [PhoneController::class, 'checkOrder']);
        Route::post('/orders/{orderId}/cancel', [PhoneController::class, 'cancelOrder']);
        Route::post('/orders/{orderId}/finish', [PhoneController::class, 'finishOrder']);
        Route::post('/orders/{orderId}/report', [PhoneController::class, 'reportNumber']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // User management
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::post('/users/{id}/adjust-balance', [AdminController::class, 'adjustUserBalance']);

        // Transaction management
        Route::get('/transactions', [AdminController::class, 'getTransactions']);

        // Order management
        Route::get('/orders', [AdminController::class, 'getOrders']);

        // Service management
        Route::get('/services', [AdminController::class, 'getServices']);
        Route::post('/services', [AdminController::class, 'createService']);
        Route::put('/services/{id}', [AdminController::class, 'updateService']);
        Route::delete('/services/{id}', [AdminController::class, 'deleteService']);

        // API logs
        Route::get('/api-logs', [AdminController::class, 'getApiLogs']);

        // Settings
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Pricing settings
        Route::get('/pricing', [AdminController::class, 'getPricingSettings']);
        Route::put('/pricing', [AdminController::class, 'updatePricingSettings']);
    });
});
