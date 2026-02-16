<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShopOrder;
use App\Models\ShopProduct;
use App\Services\ShopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function __construct(
        protected ShopService $shopService
    ) {}

    /**
     * List active products
     */
    public function index(): JsonResponse
    {
        $products = ShopProduct::active()
            ->orderBy('sort_order')
            ->orderBy('selling_price')
            ->get()
            ->map(function ($product) {
                $product->in_stock = $product->stock_count > 0 || $product->available_stock > 0;
                return $product;
            });

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Show a single product
     */
    public function show(ShopProduct $product): JsonResponse
    {
        $product->in_stock = $product->stock_count > 0 || $product->available_stock > 0;

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Purchase a product
     */
    public function purchase(Request $request, ShopProduct $product): JsonResponse
    {
        $user = $request->user();
        $result = $this->shopService->purchaseProduct($user, $product);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * List user's orders
     */
    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = ShopOrder::where('user_id', $user->id)
            ->with('product')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Show activation_code only for fulfilled orders
        $orders->getCollection()->transform(function ($order) {
            if ($order->status === 'fulfilled') {
                $order->makeVisible('activation_code');
            }
            return $order;
        });

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
     * Show a single order
     */
    public function orderDetail(ShopOrder $order, Request $request): JsonResponse
    {
        $user = $request->user();

        if ($order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $order->load('product');

        if ($order->status === 'fulfilled') {
            $order->makeVisible('activation_code');
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }
}
