<?php

use App\Http\Controllers\Api\Admin\ESIMAdminController;
use App\Http\Controllers\Api\Admin\ReferralAdminController;
use App\Http\Controllers\Api\Admin\ShopAdminController;
use App\Http\Controllers\Api\Admin\SmmAdminController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ESIMController;
use App\Http\Controllers\Api\PhoneController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\SmmController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\Webhooks\ZenditWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================================================
// WEBHOOK ROUTES (Public - No Authentication Required)
// ==========================================================================
// These routes must be public as they receive callbacks from external services

Route::prefix('webhooks')->group(function () {
    // Zendit eSIM webhooks
    // HEAD request for verification, POST for actual webhook data
    Route::match(['get', 'head'], '/zendit/esim', [ZenditWebhookController::class, 'verify']);
    Route::post('/zendit/esim', [ZenditWebhookController::class, 'handleEsim']);
});

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
});

// Public test endpoint for debugging SMS providers
Route::get('/phone/test-provider', [PhoneController::class, 'testProvider']);
Route::get('/phone/providers', [PhoneController::class, 'getProviders']);
Route::post('/phone/clear-cache', [PhoneController::class, 'clearCache']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/dashboard', [AuthController::class, 'dashboard']);
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
        Route::get('/payment-methods', [WalletController::class, 'getPaymentMethods']);
    });

    // Phone number routes
    Route::prefix('phone')->group(function () {
        Route::get('/countries', [PhoneController::class, 'getCountries']);
        Route::get('/services', [PhoneController::class, 'getServices']);
        Route::get('/prices', [PhoneController::class, 'getPrices']);
        Route::get('/operator-prices', [PhoneController::class, 'getOperatorPrices']);
        Route::post('/buy', [PhoneController::class, 'buyNumber']);
        Route::get('/orders', [PhoneController::class, 'getOrders']);
        Route::get('/orders/{orderId}', [PhoneController::class, 'checkOrder']);
        Route::post('/orders/{orderId}/cancel', [PhoneController::class, 'cancelOrder']);
        Route::post('/orders/{orderId}/finish', [PhoneController::class, 'finishOrder']);
        Route::post('/orders/{orderId}/report', [PhoneController::class, 'reportNumber']);
    });

    // eSIM routes
    Route::prefix('esim')->group(function () {
        // Browse packages
        Route::get('/packages', [ESIMController::class, 'index']);
        Route::get('/packages/{countryCode}', [ESIMController::class, 'byCountry']);
        Route::get('/package/{id}', [ESIMController::class, 'showPackage']);
        Route::get('/popular', [ESIMController::class, 'popular']);
        Route::get('/countries', [ESIMController::class, 'countries']);
        Route::get('/regions', [ESIMController::class, 'regions']);

        // Purchase & top-up
        Route::post('/purchase', [ESIMController::class, 'purchase']);
        Route::post('/topup/{profileId}', [ESIMController::class, 'topup']);

        // My eSIMs
        Route::get('/my-profiles', [ESIMController::class, 'myProfiles']);
        Route::get('/profile/{id}', [ESIMController::class, 'show']);
        Route::get('/profile/{id}/qrcode', [ESIMController::class, 'qrCode']);
        Route::post('/profile/{id}/refresh', [ESIMController::class, 'refreshStatus']);

        // Actions
        Route::post('/cancel/{id}', [ESIMController::class, 'cancel']);
        Route::post('/update-usage/{id}', [ESIMController::class, 'updateUsage']);

        // Debug/Info
        Route::get('/balance', [ESIMController::class, 'balance']);
    });

    // Referral routes
    Route::prefix('referrals')->group(function () {
        Route::get('/', [ReferralController::class, 'index']);
        Route::get('/code', [ReferralController::class, 'getCode']);
        Route::get('/list', [ReferralController::class, 'getReferrals']);
        Route::get('/commissions', [ReferralController::class, 'getCommissions']);
        Route::get('/withdrawals', [ReferralController::class, 'getWithdrawals']);
        Route::post('/withdraw', [ReferralController::class, 'requestWithdrawal']);
    });

    // SMM (Social Media Marketing) routes
    Route::prefix('smm')->group(function () {
        // Browse services
        Route::get('/categories', [SmmController::class, 'getCategories']);
        Route::get('/services', [SmmController::class, 'getServices']);
        Route::get('/services/{service}', [SmmController::class, 'getService']);

        // Orders
        Route::post('/orders', [SmmController::class, 'createOrder']);
        Route::get('/orders', [SmmController::class, 'getOrders']);
        Route::get('/orders/{reference}', [SmmController::class, 'getOrder']);
        Route::post('/orders/{reference}/cancel', [SmmController::class, 'cancelOrder']);
        Route::post('/orders/{reference}/refresh', [SmmController::class, 'refreshOrderStatus']);
    });

    // Shop (VPN) routes
    Route::prefix('shop')->group(function () {
        Route::get('/', [ShopController::class, 'index']);
        Route::get('/orders', [ShopController::class, 'myOrders']);
        Route::get('/orders/{order}', [ShopController::class, 'orderDetail']);
        Route::get('/{product}', [ShopController::class, 'show']);
        Route::post('/{product}/buy', [ShopController::class, 'purchase']);
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

        // eSIM Management
        Route::prefix('esim')->group(function () {
            Route::get('/stats', [ESIMAdminController::class, 'stats']);
            Route::post('/sync-packages', [ESIMAdminController::class, 'syncPackages']);
            Route::get('/packages', [ESIMAdminController::class, 'packages']);
            Route::put('/package/{id}', [ESIMAdminController::class, 'updatePackage']);
            Route::get('/settings', [ESIMAdminController::class, 'getSettings']);
            Route::put('/settings', [ESIMAdminController::class, 'updateSettings']);
            Route::get('/orders', [ESIMAdminController::class, 'orders']);
            Route::get('/test-connection', [ESIMAdminController::class, 'testConnection']);
            Route::get('/balance', [ESIMAdminController::class, 'balance']);
            Route::get('/pricing-calculator', [ESIMAdminController::class, 'pricingCalculator']);
            Route::post('/clear-cache', [ESIMAdminController::class, 'clearCache']);
            Route::get('/fulfillment-queue', [ESIMAdminController::class, 'fulfillmentQueue']);
            Route::post('/fulfill/{id}', [ESIMAdminController::class, 'fulfillOrder']);
            Route::post('/reject/{id}', [ESIMAdminController::class, 'rejectOrder']);
        });

        // SMM Management
        Route::prefix('smm')->group(function () {
            Route::get('/dashboard', [SmmAdminController::class, 'dashboard']);
            Route::post('/sync-services', [SmmAdminController::class, 'syncServices']);
            Route::get('/services', [SmmAdminController::class, 'getServices']);
            Route::put('/services/{service}', [SmmAdminController::class, 'updateService']);
            Route::get('/orders', [SmmAdminController::class, 'getOrders']);
            Route::post('/orders/{order}/update-status', [SmmAdminController::class, 'updateOrderStatus']);
            Route::get('/categories', [SmmAdminController::class, 'getCategories']);
            Route::put('/categories/{category}', [SmmAdminController::class, 'updateCategory']);
            Route::get('/check-balances', [SmmAdminController::class, 'checkBalances']);
            Route::get('/settings', [SmmAdminController::class, 'getSettings']);
            Route::put('/settings', [SmmAdminController::class, 'updateSettings']);
            Route::get('/fulfillment-queue', [SmmAdminController::class, 'fulfillmentQueue']);
            Route::post('/orders/{order}/fulfill', [SmmAdminController::class, 'fulfillOrder']);
            Route::post('/orders/{order}/reject', [SmmAdminController::class, 'rejectOrder']);
        });

        // Shop Management
        Route::prefix('shop')->group(function () {
            Route::get('/dashboard', [ShopAdminController::class, 'dashboard']);
            Route::get('/orders', [ShopAdminController::class, 'getOrders']);
            Route::post('/orders/{order}/fulfill', [ShopAdminController::class, 'fulfillOrder']);
            Route::post('/orders/{order}/fulfill-from-stock', [ShopAdminController::class, 'fulfillFromStock']);
            Route::post('/orders/{order}/cancel', [ShopAdminController::class, 'cancelOrder']);
            Route::get('/products', [ShopAdminController::class, 'getProducts']);
            Route::post('/products', [ShopAdminController::class, 'createProduct']);
            Route::put('/products/{product}', [ShopAdminController::class, 'updateProduct']);
            Route::post('/products/{product}/stock', [ShopAdminController::class, 'addStock']);
        });

        // Payment Gateway Management
        Route::prefix('payment-gateways')->group(function () {
            Route::get('/', [AdminController::class, 'getPaymentGateways']);
            Route::put('/{gatewayId}', [AdminController::class, 'updatePaymentGateway']);
            Route::post('/{gatewayId}/test', [AdminController::class, 'testPaymentGateway']);
        });

        // Referral Management
        Route::prefix('referrals')->group(function () {
            Route::get('/dashboard', [ReferralAdminController::class, 'dashboard']);
            Route::get('/referrals', [ReferralAdminController::class, 'getReferrals']);
            Route::get('/commissions', [ReferralAdminController::class, 'getCommissions']);
            Route::get('/withdrawals', [ReferralAdminController::class, 'getWithdrawals']);
            Route::post('/withdrawals/{id}/approve', [ReferralAdminController::class, 'approveWithdrawal']);
            Route::post('/withdrawals/{id}/reject', [ReferralAdminController::class, 'rejectWithdrawal']);
            Route::get('/users/{userId}', [ReferralAdminController::class, 'getUserReferralDetails']);
        });
    });
});
