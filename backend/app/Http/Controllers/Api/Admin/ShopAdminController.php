<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShopOrder;
use App\Models\ShopProduct;
use App\Models\ShopProductStock;
use App\Services\ShopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopAdminController extends Controller
{
    public function __construct(
        protected ShopService $shopService
    ) {}

    /**
     * Dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_orders' => ShopOrder::count(),
            'pending_orders' => ShopOrder::pending()->count(),
            'fulfilled_orders' => ShopOrder::fulfilled()->count(),
            'total_revenue' => ShopOrder::fulfilled()->sum('amount_paid'),
            'today_revenue' => ShopOrder::fulfilled()->whereDate('fulfilled_at', today())->sum('amount_paid'),
            'total_products' => ShopProduct::count(),
            'active_products' => ShopProduct::active()->count(),
            'recent_orders' => ShopOrder::with(['user', 'product'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get all orders with filters
     */
    public function getOrders(Request $request): JsonResponse
    {
        $query = ShopOrder::with(['user', 'product']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($request->input('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->input('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

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
     * Fulfill an order
     */
    public function fulfillOrder(Request $request, ShopOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'activation_code' => ['required', 'string'],
            'activation_instructions' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        $result = $this->shopService->fulfillOrder(
            $order,
            $validated['activation_code'],
            $validated['activation_instructions'] ?? null,
            $validated['admin_notes'] ?? null
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Fulfill an order from pre-loaded stock
     */
    public function fulfillFromStock(ShopOrder $order): JsonResponse
    {
        $result = $this->shopService->fulfillFromStock($order);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Request $request, ShopOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string'],
        ]);

        $result = $this->shopService->cancelOrder($order, $validated['reason'] ?? null);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get all products
     */
    public function getProducts(): JsonResponse
    {
        $products = ShopProduct::withCount([
            'stock as available_stock_count' => function ($query) {
                $query->where('is_used', false);
            },
            'orders as pending_orders_count' => function ($query) {
                $query->where('status', 'pending');
            },
            'orders as total_orders_count',
        ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Create a product
     */
    public function createProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:50'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'duration_label' => ['required', 'string', 'max:50'],
            'wholesale_cost' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $product = ShopProduct::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    /**
     * Update a product
     */
    public function updateProduct(Request $request, ShopProduct $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:50'],
            'duration_days' => ['sometimes', 'integer', 'min:1'],
            'duration_label' => ['sometimes', 'string', 'max:50'],
            'wholesale_cost' => ['sometimes', 'numeric', 'min:0'],
            'selling_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product->fresh(),
        ]);
    }

    /**
     * Add stock codes to a product
     */
    public function addStock(Request $request, ShopProduct $product): JsonResponse
    {
        $validated = $request->validate([
            'codes' => ['required', 'array', 'min:1'],
            'codes.*' => ['required', 'string'],
        ]);

        $codes = $validated['codes'];
        $added = 0;

        foreach ($codes as $code) {
            $code = trim($code);
            if (!empty($code)) {
                ShopProductStock::create([
                    'product_id' => $product->id,
                    'activation_code' => $code,
                ]);
                $added++;
            }
        }

        $product->increment('stock_count', $added);

        return response()->json([
            'success' => true,
            'message' => "{$added} stock codes added successfully",
            'data' => [
                'added' => $added,
                'total_stock' => $product->fresh()->stock_count,
            ],
        ]);
    }
}
