import api from './api';
import { ApiResponse } from '@/types';
import {
  SmmCategory,
  SmmService,
  SmmOrder,
} from '@/types/smm';

interface SmmDashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  failed_orders: number;
  total_revenue: number;
  today_revenue: number;
  active_services: number;
  total_services: number;
  recent_orders: Array<{
    id: number;
    reference: string;
    user: {
      name: string;
      email: string;
    };
    service: {
      name: string;
      category: string;
    };
    quantity: number;
    amount: number;
    status: string;
    created_at: string;
  }>;
}

interface SmmServiceDetailed extends SmmService {
  sales_count?: number;
  is_active: boolean;
}

interface ProviderBalance {
  provider: string;
  balance: number;
  currency: string;
  status: string;
}

export const adminSmmService = {
  /**
   * Get SMM dashboard statistics
   */
  getDashboard: async (): Promise<ApiResponse<SmmDashboardStats>> => {
    const response = await api.get<ApiResponse<SmmDashboardStats>>('/admin/smm/dashboard');
    return response.data;
  },

  /**
   * Sync services from all providers
   */
  syncServices: async (): Promise<ApiResponse<{ synced: number; message: string }>> => {
    const response = await api.post<ApiResponse<{ synced: number; message: string }>>('/admin/smm/sync-services');
    return response.data;
  },

  /**
   * Get paginated services list with filters
   */
  getServices: async (params: {
    page?: number;
    per_page?: number;
    category_id?: number;
    provider?: string;
    is_active?: boolean;
    search?: string;
  } = {}): Promise<ApiResponse<SmmServiceDetailed[]>> => {
    const response = await api.get<ApiResponse<SmmServiceDetailed[]>>('/admin/smm/services', { params });
    return response.data;
  },

  /**
   * Update a service (pricing, status, limits)
   */
  updateService: async (
    serviceId: number,
    data: {
      price_per_1000?: number;
      min_order?: number;
      max_order?: number;
      is_active?: boolean;
      sort_order?: number;
    }
  ): Promise<ApiResponse<SmmServiceDetailed>> => {
    const response = await api.put<ApiResponse<SmmServiceDetailed>>(`/admin/smm/services/${serviceId}`, data);
    return response.data;
  },

  /**
   * Get paginated orders list with filters
   */
  getOrders: async (params: {
    page?: number;
    per_page?: number;
    status?: string;
    user_id?: number;
    search?: string;
    from_date?: string;
    to_date?: string;
  } = {}): Promise<ApiResponse<SmmOrder[]>> => {
    const response = await api.get<ApiResponse<SmmOrder[]>>('/admin/smm/orders', { params });
    return response.data;
  },

  /**
   * Update order status from provider
   */
  updateOrderStatus: async (orderId: number): Promise<ApiResponse<SmmOrder>> => {
    const response = await api.post<ApiResponse<SmmOrder>>(`/admin/smm/orders/${orderId}/update-status`);
    return response.data;
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<ApiResponse<SmmCategory[]>> => {
    const response = await api.get<ApiResponse<SmmCategory[]>>('/admin/smm/categories');
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (
    categoryId: number,
    data: {
      name?: string;
      icon?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ): Promise<ApiResponse<SmmCategory>> => {
    const response = await api.put<ApiResponse<SmmCategory>>(`/admin/smm/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Check provider balances
   */
  checkBalances: async (): Promise<ApiResponse<ProviderBalance[]>> => {
    const response = await api.get<ApiResponse<ProviderBalance[]>>('/admin/smm/check-balances');
    return response.data;
  },
};
