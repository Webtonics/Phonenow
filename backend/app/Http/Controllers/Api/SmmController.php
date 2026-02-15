<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SmmCategory;
use App\Models\SmmService;
use App\Models\SmmOrder;
use App\Services\SmmManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmmController extends Controller
{
    public function __construct(
        protected SmmManager $smmManager
    ) {}

    /**
     * Get all categories
     */
    public function getCategories(): JsonResponse
    {
        $categories = SmmCategory::active()
            ->withCount('activeServices')
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'services_count' => $cat->active_services_count,
            ]);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get services with filters
     */
    public function getServices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'exists:smm_categories,id'],
            'type' => ['sometimes', 'string'],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = SmmService::query()
            ->with('category')
            ->where('is_active', true);

        if (isset($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('category', function ($cq) use ($search) {
                      $cq->where('name', 'like', '%' . $search . '%');
                  });
            });

            // Relevance ordering: name starts with search term first, then contains
            $query->orderByRaw("CASE WHEN name LIKE ? THEN 0 ELSE 1 END", [$search . '%'])
                ->orderBy('sort_order')
                ->orderBy('name');
        } else {
            $query->orderBy('sort_order')
                ->orderBy('name');
        }

        $services = $query->paginate($validated['per_page'] ?? 50);

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
     * Get service details
     */
    public function getService(SmmService $service): JsonResponse
    {
        if (!$service->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Service not available',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $service->id,
                'category' => $service->category->name,
                'name' => $service->name,
                'description' => $service->description,
                'type' => $service->type,
                'price_per_1000' => (float) $service->price_per_1000,
                'min_order' => (int) $service->min_order,
                'max_order' => (int) $service->max_order,
                'average_time_minutes' => $service->average_time_minutes,
                'refill_enabled' => $service->refill_enabled,
                'refill_days' => $service->refill_days,
                'cancel_enabled' => $service->cancel_enabled,
            ],
        ]);
    }

    /**
     * Create new order
     */
    public function createOrder(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'service_id' => ['required', 'exists:smm_services,id'],
            'link' => ['required', 'url', 'max:500'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $service = SmmService::find($validated['service_id']);

        if (!$service || !$service->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Service not available',
            ], 404);
        }

        $result = $this->smmManager->createOrder(
            $user,
            $service,
            $validated['link'],
            $validated['quantity']
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'reference' => $result['data']['reference'],
                'order' => [
                    'id' => $result['data']['order']->id,
                    'reference' => $result['data']['order']->reference,
                    'service' => $service->name,
                    'quantity' => $result['data']['order']->quantity,
                    'amount' => (float) $result['data']['order']->amount,
                    'status' => $result['data']['order']->status,
                ],
            ],
        ]);
    }

    /**
     * Get user orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,processing,in_progress,completed,partial,cancelled,failed'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = SmmOrder::where('user_id', $user->id)
            ->with(['service.category']);

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
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
     * Get order details
     */
    public function getOrder(Request $request, string $reference): JsonResponse
    {
        $user = $request->user();

        $order = SmmOrder::where('reference', $reference)
            ->where('user_id', $user->id)
            ->with(['service.category'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $order->id,
                'reference' => $order->reference,
                'service' => [
                    'name' => $order->service->name,
                    'category' => $order->service->category->name,
                ],
                'link' => $order->link,
                'quantity' => $order->quantity,
                'amount' => (float) $order->amount,
                'status' => $order->status,
                'start_count' => $order->start_count,
                'remains' => $order->remains,
                'progress' => $order->getProgressPercentage(),
                'created_at' => $order->created_at,
                'completed_at' => $order->completed_at,
            ],
        ]);
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Request $request, string $reference): JsonResponse
    {
        $user = $request->user();

        $order = SmmOrder::where('reference', $reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $result = $this->smmManager->cancelOrder($order);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * Refresh order status
     */
    public function refreshOrderStatus(Request $request, string $reference): JsonResponse
    {
        $user = $request->user();

        $order = SmmOrder::where('reference', $reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

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
            'data' => [
                'status' => $order->status,
                'progress' => $order->getProgressPercentage(),
                'remains' => $order->remains,
            ],
        ]);
    }
}
