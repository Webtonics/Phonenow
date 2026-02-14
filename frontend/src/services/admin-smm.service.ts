import api from './api';
import { ApiResponse } from '@/types';
import {
  SmmCategory,
  SmmOrderStatus,
} from '@/types/smm';

export const adminSmmService = {
  /**
   * Get SMM dashboard statistics
   */
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/admin/smm/dashboard');
    return response.data;
  },

  /**
   * Sync services from all providers
   */
  syncServices: async (): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/admin/smm/sync-services', {}, {
      timeout: 300000, // 5 minutes timeout for large sync operations
    });
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
  } = {}): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/smm/services', { params });
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
  ): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/admin/smm/services/${serviceId}`, data);
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
  } = {}): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/smm/orders', { params });
    return response.data;
  },

  /**
   * Update order status from provider
   */
  updateOrderStatus: async (orderId: number): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>(`/admin/smm/orders/${orderId}/update-status`);
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
  checkBalances: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/smm/check-balances');
    return response.data;
  },
};
