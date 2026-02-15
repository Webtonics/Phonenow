import api from './api';
import type { SmmCategory, SmmService, SmmOrder, ApiResponse } from '@/types';

export const smmService = {
  // Get categories
  getCategories: async (): Promise<ApiResponse<SmmCategory[]>> => {
    const response = await api.get<ApiResponse<SmmCategory[]>>('/smm/categories');
    return response.data;
  },

  // Get services
  getServices: async (params?: {
    category_id?: number;
    type?: string;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<SmmService[]>> => {
    const response = await api.get<ApiResponse<SmmService[]>>('/smm/services', { params });
    return response.data;
  },

  // Get service details
  getService: async (id: number): Promise<ApiResponse<SmmService>> => {
    const response = await api.get<ApiResponse<SmmService>>(`/smm/services/${id}`);
    return response.data;
  },

  // Create order
  createOrder: async (data: {
    service_id: number;
    link: string;
    quantity: number;
  }): Promise<ApiResponse<{ reference: string; order: SmmOrder }>> => {
    const response = await api.post<ApiResponse<{ reference: string; order: SmmOrder }>>('/smm/orders', data);
    return response.data;
  },

  // Get orders
  getOrders: async (params?: {
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<SmmOrder[]>> => {
    const response = await api.get<ApiResponse<SmmOrder[]>>('/smm/orders', { params });
    return response.data;
  },

  // Get order details
  getOrder: async (reference: string): Promise<ApiResponse<SmmOrder>> => {
    const response = await api.get<ApiResponse<SmmOrder>>(`/smm/orders/${reference}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (reference: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>(`/smm/orders/${reference}/cancel`);
    return response.data;
  },

  // Refresh order status
  refreshOrderStatus: async (reference: string): Promise<ApiResponse<{ status: string; progress: number; remains?: number }>> => {
    const response = await api.post<ApiResponse<{ status: string; progress: number; remains?: number }>>(
      `/smm/orders/${reference}/refresh`
    );
    return response.data;
  },
};
