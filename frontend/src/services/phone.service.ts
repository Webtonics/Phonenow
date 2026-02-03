import api from './api';
import { ApiResponse } from '@/types';

interface PhoneService {
  name: string;
  display_name: string;
  quantity: number;
  base_price: number;
  price: number;
  category: string;
}

interface PhoneOrder {
  id: number;
  order_id: number;
  order_number: string;
  phone: string;
  product: string;
  operator: string;
  country: string;
  status: string;
  price: number;
  sms: SmsMessage[];
  expires: string | null;
  created_at: string;
}

interface SmsMessage {
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string;
}

interface OrdersResponse {
  success: boolean;
  data: PhoneOrder[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface PurchaseResponse {
  order_id: number;
  order_number: string;
  phone: string;
  product: string;
  operator: string;
  country: string;
  status: string;
  price: number;
  expires: string | null;
  balance: number;
}

interface OperatorPrice {
  id: string;
  price: number;
  base_price: number;
  available: number;
  success_rate: number;
}

export const phoneService = {
  /**
   * Get available countries
   */
  getCountries: async () => {
    return api.get<ApiResponse<Record<string, unknown>>>('/phone/countries');
  },

  /**
   * Get available services for a country
   */
  getServices: async (country: string, operator?: string) => {
    const params: Record<string, string> = { country };
    if (operator) params.operator = operator;
    return api.get<ApiResponse<PhoneService[]>>('/phone/services', { params });
  },

  /**
   * Get prices for services
   */
  getPrices: async (country: string, product?: string) => {
    const params: Record<string, string> = { country };
    if (product) params.product = product;
    return api.get<ApiResponse<Record<string, unknown>>>('/phone/prices', { params });
  },

  /**
   * Get operator prices for a specific service
   * Returns different pricing options based on operators
   */
  getOperatorPrices: async (country: string, product: string) => {
    return api.get<ApiResponse<OperatorPrice[]>>('/phone/operator-prices', {
      params: { country, product },
    });
  },

  /**
   * Purchase a phone number
   */
  buyNumber: async (country: string, operator: string, product: string) => {
    return api.post<ApiResponse<PurchaseResponse>>('/phone/buy', {
      country,
      operator,
      product,
    });
  },

  /**
   * Get user's phone orders
   */
  getOrders: async (params: {
    status?: string;
    per_page?: number;
    page?: number;
  } = {}) => {
    return api.get<OrdersResponse>('/phone/orders', { params });
  },

  /**
   * Check order status and get SMS
   */
  checkOrder: async (orderId: number | string) => {
    return api.get<ApiResponse<PhoneOrder>>(`/phone/orders/${orderId}`);
  },

  /**
   * Cancel order and get refund
   */
  cancelOrder: async (orderId: number | string) => {
    return api.post<ApiResponse<{
      order_id: number;
      refunded_amount: number;
      balance: number;
    }>>(`/phone/orders/${orderId}/cancel`);
  },

  /**
   * Finish/complete an order
   */
  finishOrder: async (orderId: number | string) => {
    return api.post<ApiResponse<{
      order_id: number;
      status: string;
    }>>(`/phone/orders/${orderId}/finish`);
  },

  /**
   * Report bad number and get refund
   */
  reportNumber: async (orderId: number | string, reason?: string) => {
    return api.post<ApiResponse<{
      order_id: number;
      refunded_amount: number;
      balance: number;
    }>>(`/phone/orders/${orderId}/report`, { reason });
  },
};
