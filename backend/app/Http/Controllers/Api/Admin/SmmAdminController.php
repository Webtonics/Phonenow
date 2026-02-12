<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmmCategory;
use App\Models\SmmService;
use App\Models\SmmOrder;
use App\Services\SmmManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmmAdminController extends Controller
{
    public function __construct(
        protected SmmManager $smmManager
    ) {}

    /**
     * Get SMM dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        $totalOrders = SmmOrder::count();
        $pendingOrders = SmmOrder::whereIn('status', ['pending', 'processing', 'in_progress'])->count();
        $completedOrders = SmmOrder::where('status', 'completed')->count();
        $totalRevenue = SmmOrder::where('status', 'completed')->sum('amount');
        $todayRevenue = SmmOrder::where('status', 'completed')
            ->whereDate('created_at', today())
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'total_revenue' => (float) $totalRevenue,
                'today_revenue' => (float) $todayRevenue,
                'total_services' => SmmService::where('is_active', true)->count(),
                'total_categories' => SmmCategory::where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Sync services from providers
     */
    public function syncServices(): JsonResponse
    {
        $results = $this->smmManager->syncServices();

        return response()->json([
            'success' => true,
            'message' => 'Services synced successfully',
            'data' => $results,
        ]);
    }

    /**
     * Get all services
     */
    public function getServices(Request $request): JsonResponse
    {
        $query = SmmService::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('provider')) {
            $query->where('provider', $request->provider);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $services = $query->orderBy('category_id')
            ->orderBy('sort_order')
            ->paginate($request->per_page ?? 50);

        return response()->json([
            'success' => true,
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    /**
     * Update service
     */
    public function updateService(Request $request, SmmService $service): JsonResponse
    {
        $validated = $request->validate([
            'price_per_1000' => ['sometimes', 'numeric', 'min:0'],
            'min_order' => ['sometimes', 'integer', 'min:1'],
            'max_order' => ['sometimes', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $service,
        ]);
    }

    /**
     * Get all orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $query = SmmOrder::with(['user', 'service.category']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);

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
     * Check provider balances
     */
    public function checkBalances(): JsonResponse
    {
        $balances = $this->smmManager->checkProviderBalances();

        return response()->json([
            'success' => true,
            'data' => $balances,
        ]);
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(SmmOrder $order): JsonResponse
    {
        $updated = $this->smmManager->updateOrderStatus($order);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status',
            ], 400);
        }

        $order->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
            'data' => $order,
        ]);
    }

    /**
     * Get categories
     */
    public function getCategories(): JsonResponse
    {
        $categories = SmmCategory::withCount('services')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Update category
     */
    public function updateCategory(Request $request, SmmCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['sometimes', 'string', 'max:50'],
            'sort_order' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }
}
