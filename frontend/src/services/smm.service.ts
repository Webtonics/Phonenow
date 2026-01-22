import api from './api';
import {
  ApiResponse,
  Service,
  Order,
  SMMCategory,
} from '@/types';

export const smmService = {
  /**
   * Get SMM categories
   */
  getCategories: async (): Promise<ApiResponse<{ categories: SMMCategory[] }>> => {
    const response = await api.get<ApiResponse<{ categories: SMMCategory[] }>>('/smm/categories');
    return response.data;
  },

  /**
   * Get SMM services
   */
  getServices: async (params: {
    category?: string;
    search?: string;
  } = {}): Promise<ApiResponse<{ services: Service[] }>> => {
    const response = await api.get<ApiResponse<{ services: Service[] }>>('/smm/services', { params });
    return response.data;
  },

  /**
   * Place SMM order
   */
  purchase: async (data: {
    service_id: number;
    link: string;
    quantity?: number;
  }): Promise<ApiResponse<{ order: Order }>> => {
    const response = await api.post<ApiResponse<{ order: Order }>>('/smm/buy', data);
    return response.data;
  },

  /**
   * Get SMM order status
   */
  getOrder: async (orderId: number): Promise<ApiResponse<Order>> => {
    const response = await api.get<ApiResponse<Order>>(`/smm/${orderId}`);
    return response.data;
  },
};
