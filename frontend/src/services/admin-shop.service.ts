import api from './api';
import type { ShopProduct, ShopOrder } from '../types/shop';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ShopDashboardStats {
  total_orders: number;
  pending_orders: number;
  fulfilled_orders: number;
  total_revenue: number;
  today_revenue: number;
  total_products: number;
  active_products: number;
  recent_orders: ShopOrder[];
}

export const adminShopService = {
  getDashboard: async (): Promise<ApiResponse<ShopDashboardStats>> => {
    const response = await api.get<ApiResponse<ShopDashboardStats>>('/admin/shop/dashboard');
    return response.data;
  },

  getOrders: async (params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<ApiResponse<ShopOrder[]>> => {
    const response = await api.get<ApiResponse<ShopOrder[]>>('/admin/shop/orders', { params });
    return response.data;
  },

  fulfillOrder: async (
    orderId: number,
    data: {
      activation_code: string;
      activation_instructions?: string;
      admin_notes?: string;
    }
  ): Promise<ApiResponse<ShopOrder>> => {
    const response = await api.post<ApiResponse<ShopOrder>>(`/admin/shop/orders/${orderId}/fulfill`, data);
    return response.data;
  },

  fulfillFromStock: async (orderId: number): Promise<ApiResponse<ShopOrder>> => {
    const response = await api.post<ApiResponse<ShopOrder>>(`/admin/shop/orders/${orderId}/fulfill-from-stock`);
    return response.data;
  },

  cancelOrder: async (orderId: number, reason?: string): Promise<ApiResponse<ShopOrder>> => {
    const response = await api.post<ApiResponse<ShopOrder>>(`/admin/shop/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  getProducts: async (): Promise<ApiResponse<ShopProduct[]>> => {
    const response = await api.get<ApiResponse<ShopProduct[]>>('/admin/shop/products');
    return response.data;
  },

  createProduct: async (data: {
    name: string;
    description?: string;
    category?: string;
    duration_days: number;
    duration_label: string;
    wholesale_cost: number;
    selling_price: number;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<ApiResponse<ShopProduct>> => {
    const response = await api.post<ApiResponse<ShopProduct>>('/admin/shop/products', data);
    return response.data;
  },

  updateProduct: async (
    productId: number,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      duration_days: number;
      duration_label: string;
      wholesale_cost: number;
      selling_price: number;
      is_active: boolean;
      sort_order: number;
    }>
  ): Promise<ApiResponse<ShopProduct>> => {
    const response = await api.put<ApiResponse<ShopProduct>>(`/admin/shop/products/${productId}`, data);
    return response.data;
  },

  addStock: async (
    productId: number,
    codes: string[]
  ): Promise<ApiResponse<{ added: number; total_stock: number }>> => {
    const response = await api.post<ApiResponse<{ added: number; total_stock: number }>>(
      `/admin/shop/products/${productId}/stock`,
      { codes }
    );
    return response.data;
  },
};
