export interface ShopProduct {
  id: number;
  name: string;
  description?: string;
  category: string;
  duration_days: number;
  duration_label: string;
  wholesale_cost?: number;
  selling_price: number;
  stock_count: number;
  is_active: boolean;
  sort_order: number;
  in_stock?: boolean;
  available_stock_count?: number;
  pending_orders_count?: number;
  total_orders_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type ShopOrderStatus = 'pending' | 'fulfilled' | 'cancelled' | 'refunded';

export interface ShopOrder {
  id: number;
  reference: string;
  product: ShopProduct;
  user?: { id: number; name: string; email: string };
  amount_paid: number;
  balance_before?: number;
  balance_after?: number;
  status: ShopOrderStatus;
  activation_code?: string;
  activation_instructions?: string;
  admin_notes?: string;
  created_at: string;
  fulfilled_at?: string;
  cancelled_at?: string;
}

export function getShopStatusColor(status: ShopOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'fulfilled':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getShopStatusLabel(status: ShopOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'fulfilled':
      return 'Fulfilled';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}
