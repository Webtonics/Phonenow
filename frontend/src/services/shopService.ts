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

export const shopService = {
  getProducts: async (): Promise<ApiResponse<ShopProduct[]>> => {
    const response = await api.get<ApiResponse<ShopProduct[]>>('/shop');
    return response.data;
  },

  getProduct: async (productId: number): Promise<ApiResponse<ShopProduct>> => {
    const response = await api.get<ApiResponse<ShopProduct>>(`/shop/${productId}`);
    return response.data;
  },

  purchase: async (productId: number): Promise<ApiResponse<{ order: ShopOrder; reference: string }>> => {
    const response = await api.post<ApiResponse<{ order: ShopOrder; reference: string }>>(`/shop/${productId}/buy`);
    return response.data;
  },

  getOrders: async (page: number = 1): Promise<ApiResponse<ShopOrder[]>> => {
    const response = await api.get<ApiResponse<ShopOrder[]>>('/shop/orders', { params: { page } });
    return response.data;
  },

  getOrder: async (orderId: number): Promise<ApiResponse<ShopOrder>> => {
    const response = await api.get<ApiResponse<ShopOrder>>(`/shop/orders/${orderId}`);
    return response.data;
  },
};
