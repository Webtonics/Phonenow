<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiLog;
use App\Models\Order;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct(
        protected ExchangeRateService $exchangeRateService
    ) {}
    /**
     * Get dashboard statistics
     */
    public function dashboard(): JsonResponse
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        // User stats
        $totalUsers = User::count();
        $newUsersToday = User::where('created_at', '>=', $today)->count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();
        $activeUsers = User::where('is_active', true)->count();

        // Transaction stats
        $totalDeposits = Transaction::where('type', 'deposit')
            ->where('status', 'completed')
            ->sum('amount');

        $depositsToday = Transaction::where('type', 'deposit')
            ->where('status', 'completed')
            ->where('created_at', '>=', $today)
            ->sum('amount');

        $depositsThisMonth = Transaction::where('type', 'deposit')
            ->where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('amount');

        // Order stats
        $totalOrders = Order::count();
        $ordersToday = Order::where('created_at', '>=', $today)->count();
        $ordersThisMonth = Order::where('created_at', '>=', $thisMonth)->count();
        $pendingOrders = Order::where('status', 'pending')->count();

        // Revenue stats
        $totalRevenue = Transaction::where('type', 'purchase')
            ->where('status', 'completed')
            ->sum('amount');

        $revenueToday = Transaction::where('type', 'purchase')
            ->where('status', 'completed')
            ->where('created_at', '>=', $today)
            ->sum('amount');

        $revenueThisMonth = Transaction::where('type', 'purchase')
            ->where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('amount');

        // Recent activity
        $recentTransactions = Transaction::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $recentOrders = Order::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => [
                    'total' => $totalUsers,
                    'today' => $newUsersToday,
                    'this_month' => $newUsersThisMonth,
                    'active' => $activeUsers,
                ],
                'deposits' => [
                    'total' => (float) $totalDeposits,
                    'today' => (float) $depositsToday,
                    'this_month' => (float) $depositsThisMonth,
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'today' => $ordersToday,
                    'this_month' => $ordersThisMonth,
                    'pending' => $pendingOrders,
                ],
                'revenue' => [
                    'total' => (float) $totalRevenue,
                    'today' => (float) $revenueToday,
                    'this_month' => (float) $revenueThisMonth,
                ],
                'recent_transactions' => $recentTransactions,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    /**
     * Get paginated users
     */
    public function getUsers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'role' => ['sometimes', 'in:customer,reseller,admin'],
            'status' => ['sometimes', 'in:active,inactive'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = User::query();

        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (isset($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (isset($validated['status'])) {
            $query->where('is_active', $validated['status'] === 'active');
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Get single user details
     */
    public function getUser(string $id): JsonResponse
    {
        $user = User::with(['transactions' => function ($q) {
            $q->orderBy('created_at', 'desc')->take(20);
        }, 'orders' => function ($q) {
            $q->orderBy('created_at', 'desc')->take(20);
        }])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update user details
     */
    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $id],
            'phone' => ['sometimes', 'string', 'max:20', 'unique:users,phone,' . $id],
            'role' => ['sometimes', 'in:customer,reseller,admin'],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Toggle user active status
     */
    public function toggleUserStatus(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'User activated.' : 'User deactivated.',
            'data' => [
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Adjust user balance
     */
    public function adjustUserBalance(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $amount = $validated['amount'];
        $type = $amount >= 0 ? 'credit' : 'debit';

        DB::beginTransaction();

        try {
            if ($amount >= 0) {
                $user->addBalance($amount);
            } else {
                if (!$user->hasBalance(abs($amount))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient balance for deduction.',
                    ], 400);
                }
                $user->deductBalance(abs($amount));
            }

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'type' => $amount >= 0 ? 'deposit' : 'withdrawal',
                'amount' => abs($amount),
                'currency' => 'NGN',
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => "Admin adjustment: {$validated['reason']}",
                'payment_method' => 'admin',
                'metadata' => [
                    'adjusted_by' => request()->user()->id,
                    'reason' => $validated['reason'],
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Balance adjusted successfully.',
                'data' => [
                    'new_balance' => (float) $user->fresh()->balance,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust balance.',
            ], 500);
        }
    }

    /**
     * Get paginated transactions
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'integer'],
            'type' => ['sometimes', 'in:deposit,withdrawal,purchase,refund'],
            'status' => ['sometimes', 'in:pending,completed,failed,cancelled'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = Transaction::with('user:id,name,email');

        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (isset($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Get paginated orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'integer'],
            'type' => ['sometimes', 'in:phone,smm'],
            'status' => ['sometimes', 'in:pending,active,completed,cancelled,expired,refunded'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = Order::with('user:id,name,email');

        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (isset($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Get services
     */
    public function getServices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['sometimes', 'in:phone_number,smm'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $query = Service::query();

        if (isset($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (isset($validated['is_active'])) {
            $query->where('is_active', $validated['is_active']);
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Create a service
     */
    public function createService(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:phone_number,smm'],
            'provider' => ['required', 'in:5sim,peakerr'],
            'provider_service_code' => ['required', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'retail_price' => ['required', 'numeric', 'min:0'],
            'reseller_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully.',
            'data' => $service,
        ], 201);
    }

    /**
     * Update a service
     */
    public function updateService(Request $request, string $id): JsonResponse
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'provider_service_code' => ['sometimes', 'string', 'max:100'],
            'cost_price' => ['sometimes', 'numeric', 'min:0'],
            'retail_price' => ['sometimes', 'numeric', 'min:0'],
            'reseller_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'data' => $service,
        ]);
    }

    /**
     * Delete a service
     */
    public function deleteService(string $id): JsonResponse
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found.',
            ], 404);
        }

        // Check if service has orders
        $hasOrders = Order::where('service_id', $id)->exists();

        if ($hasOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete service with existing orders. Deactivate it instead.',
            ], 400);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.',
        ]);
    }

    /**
     * Get API logs
     */
    public function getApiLogs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['sometimes', 'string'],
            'status_code' => ['sometimes', 'integer'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = ApiLog::with('user:id,name,email');

        if (isset($validated['endpoint'])) {
            $query->where('endpoint', 'like', "%{$validated['endpoint']}%");
        }

        if (isset($validated['status_code'])) {
            $query->where('status_code', $validated['status_code']);
        }

        if (isset($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (isset($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get application settings
     */
    public function getSettings(Request $request): JsonResponse
    {
        $group = $request->query('group');

        if ($group) {
            $settings = Setting::getByGroup($group);
        } else {
            // Get all settings grouped
            $settings = [
                'general' => Setting::getByGroup('general'),
                'pricing' => Setting::getByGroup('pricing'),
                'payment' => Setting::getByGroup('payment'),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update application settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
        ]);

        foreach ($validated['settings'] as $setting) {
            $existing = Setting::where('key', $setting['key'])->first();

            if ($existing) {
                $existing->update(['value' => (string) $setting['value']]);
                Cache::forget("setting:{$setting['key']}");
                Cache::forget("settings:group:{$existing->group}");
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
        ]);
    }

    /**
     * Get pricing settings specifically
     */
    public function getPricingSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'phone_markup_percentage' => Setting::getValue('phone_markup_percentage', 1000),
                'phone_min_price' => Setting::getValue('phone_min_price', 500),
                'phone_platform_fee' => Setting::getValue('phone_platform_fee', 0),
                'smm_markup_percentage' => Setting::getValue('smm_markup_percentage', 500),
                'min_deposit' => Setting::getValue('min_deposit', 1000),
                'max_deposit' => Setting::getValue('max_deposit', 1000000),
                'current_exchange_rate' => $this->exchangeRateService->getUsdToNgnRate(),
            ],
        ]);
    }

    /**
     * Update pricing settings
     */
    public function updatePricingSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_markup_percentage' => ['sometimes', 'numeric', 'min:100', 'max:10000'],
            'phone_min_price' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'phone_platform_fee' => ['sometimes', 'numeric', 'min:0', 'max:10000'],
            'smm_markup_percentage' => ['sometimes', 'numeric', 'min:100', 'max:10000'],
            'min_deposit' => ['sometimes', 'numeric', 'min:100'],
            'max_deposit' => ['sometimes', 'numeric', 'min:1000'],
        ]);

        foreach ($validated as $key => $value) {
            Setting::setValue($key, $value, 'float', 'pricing');
        }

        return response()->json([
            'success' => true,
            'message' => 'Pricing settings updated successfully.',
            'data' => $validated,
        ]);
    }
}
