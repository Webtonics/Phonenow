import api from './api';
import {
  Order,
  PaginatedResponse,
} from '@/types';

export const ordersService = {
  /**
   * Get all orders
   */
  getOrders: async (params: {
    page?: number;
    limit?: number;
    type?: 'phone_number' | 'esim';
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  } = {}): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return response.data;
  },
};
