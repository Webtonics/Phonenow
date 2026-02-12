import api from './api';
import type { SmmCategory, SmmService, SmmOrder } from '@/types';

export const smmService = {
  // Get categories
  getCategories: async () => {
    return api.get<SmmCategory[]>('/smm/categories');
  },

  // Get services
  getServices: async (params?: {
    category_id?: number;
    type?: string;
    search?: string;
    per_page?: number;
  }) => {
    return api.get<SmmService[]>('/smm/services', { params });
  },

  // Get service details
  getService: async (id: number) => {
    return api.get<SmmService>(`/smm/services/${id}`);
  },

  // Create order
  createOrder: async (data: {
    service_id: number;
    link: string;
    quantity: number;
  }) => {
    return api.post<{ reference: string; order: SmmOrder }>('/smm/orders', data);
  },

  // Get orders
  getOrders: async (params?: {
    status?: string;
    per_page?: number;
  }) => {
    return api.get<SmmOrder[]>('/smm/orders', { params });
  },

  // Get order details
  getOrder: async (reference: string) => {
    return api.get<SmmOrder>(`/smm/orders/${reference}`);
  },

  // Cancel order
  cancelOrder: async (reference: string) => {
    return api.post(`/smm/orders/${reference}/cancel`);
  },

  // Refresh order status
  refreshOrderStatus: async (reference: string) => {
    return api.post<{ status: string; progress: number; remains?: number }>(
      `/smm/orders/${reference}/refresh`
    );
  },
};
