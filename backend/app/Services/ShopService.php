<?php

namespace App\Services;

use App\Mail\ShopOrderFulfilled;
use App\Models\ShopOrder;
use App\Models\ShopProduct;
use App\Models\ShopProductStock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ShopService
{
    /**
     * Purchase a product
     */
    public function purchaseProduct(User $user, ShopProduct $product): array
    {
        if (!$product->is_active) {
            return [
                'success' => false,
                'message' => 'This product is currently unavailable',
            ];
        }

        if (!$user->hasBalance($product->selling_price)) {
            return [
                'success' => false,
                'message' => 'Insufficient balance',
            ];
        }

        DB::beginTransaction();

        try {
            $balanceBefore = $user->balance;

            $user->deductBalance($product->selling_price);
            $user->refresh();
            $balanceAfter = $user->balance;

            $transaction = $user->transactions()->create([
                'type' => 'debit',
                'amount' => $product->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'description' => "Shop: {$product->name}",
                'reference' => 'TXN-' . strtoupper(uniqid()),
                'payment_method' => 'wallet',
            ]);

            $order = ShopOrder::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'transaction_id' => $transaction->id,
                'reference' => ShopOrder::generateReference(),
                'amount_paid' => $product->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'pending',
            ]);

            DB::commit();

            Log::info('Shop order created', [
                'order_id' => $order->id,
                'user_id' => $user->id,
                'product' => $product->name,
                'amount' => $product->selling_price,
            ]);

            return [
                'success' => true,
                'message' => 'Order placed successfully! You will receive your activation code shortly.',
                'data' => [
                    'order' => $order->load('product'),
                    'reference' => $order->reference,
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Shop order creation failed', [
                'user_id' => $user->id,
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to create order. Please try again.',
            ];
        }
    }

    /**
     * Fulfill an order with an activation code
     */
    public function fulfillOrder(ShopOrder $order, string $activationCode, ?string $instructions = null, ?string $adminNotes = null): array
    {
        if ($order->status !== 'pending') {
            return [
                'success' => false,
                'message' => 'Only pending orders can be fulfilled',
            ];
        }

        $order->update([
            'status' => 'fulfilled',
            'activation_code' => $activationCode,
            'activation_instructions' => $instructions,
            'admin_notes' => $adminNotes,
            'fulfilled_at' => now(),
        ]);

        try {
            Mail::to($order->user)->send(new ShopOrderFulfilled($order->fresh()->load('product')));
        } catch (\Exception $e) {
            Log::warning('Failed to send shop fulfillment email', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'success' => true,
            'message' => 'Order fulfilled successfully',
            'data' => $order->fresh()->load('product'),
        ];
    }

    /**
     * Fulfill an order from pre-loaded stock
     */
    public function fulfillFromStock(ShopOrder $order): array
    {
        if ($order->status !== 'pending') {
            return [
                'success' => false,
                'message' => 'Only pending orders can be fulfilled',
            ];
        }

        $stockItem = ShopProductStock::where('product_id', $order->product_id)
            ->available()
            ->first();

        if (!$stockItem) {
            return [
                'success' => false,
                'message' => 'No stock available for this product',
            ];
        }

        $result = $this->fulfillOrder($order, $stockItem->activation_code);

        if ($result['success']) {
            $stockItem->update([
                'is_used' => true,
                'used_at' => now(),
                'order_id' => $order->id,
            ]);

            $order->product->decrement('stock_count');
        }

        return $result;
    }

    /**
     * Cancel an order and refund the user
     */
    public function cancelOrder(ShopOrder $order, ?string $reason = null): array
    {
        if ($order->status !== 'pending') {
            return [
                'success' => false,
                'message' => 'Only pending orders can be cancelled',
            ];
        }

        DB::beginTransaction();

        try {
            $user = $order->user;
            $balanceBefore = $user->balance;

            $user->addBalance($order->amount_paid);
            $user->refresh();
            $balanceAfter = $user->balance;

            $user->transactions()->create([
                'type' => 'credit',
                'amount' => $order->amount_paid,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'description' => "Shop Refund: {$order->reference}",
                'reference' => 'TXN-' . strtoupper(uniqid()),
                'payment_method' => 'wallet',
            ]);

            $order->update([
                'status' => 'cancelled',
                'admin_notes' => $reason,
                'cancelled_at' => now(),
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Order cancelled and user refunded',
                'data' => $order->fresh()->load('product'),
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Shop order cancellation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage(),
            ];
        }
    }
}
