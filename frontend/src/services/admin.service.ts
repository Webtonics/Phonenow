import api from './api';
import {
  ApiResponse,
  User,
  Order,
  Transaction,
  Service,
  PaymentGateway,
} from '@/types';

interface DashboardData {
  users: {
    total: number;
    today: number;
    this_month: number;
    active: number;
  };
  deposits: {
    total: number;
    today: number;
    this_month: number;
  };
  orders: {
    total: number;
    today: number;
    this_month: number;
    pending: number;
  };
  revenue: {
    total: number;
    today: number;
    this_month: number;
  };
  recent_transactions: Transaction[];
  recent_orders: Order[];
}

interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const adminService = {
  /**
   * Get dashboard stats
   */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await api.get<ApiResponse<DashboardData>>('/admin/dashboard');
    return response.data;
  },

  /**
   * Get all users
   */
  getUsers: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: 'customer' | 'reseller' | 'admin';
    status?: 'active' | 'inactive';
  } = {}): Promise<{ success: boolean; data: User[]; meta: PaginatedMeta }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get user details
   */
  getUser: async (userId: number): Promise<ApiResponse<User>> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (userId: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'customer' | 'reseller' | 'admin';
  }): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Toggle user active status
   */
  toggleUserStatus: async (userId: number): Promise<ApiResponse<{ is_active: boolean }>> => {
    const response = await api.post(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  /**
   * Adjust user balance
   */
  adjustUserBalance: async (userId: number, amount: number, reason: string): Promise<ApiResponse<{ new_balance: number }>> => {
    const response = await api.post(`/admin/users/${userId}/adjust-balance`, { amount, reason });
    return response.data;
  },

  /**
   * Get all transactions
   */
  getTransactions: async (params: {
    page?: number;
    per_page?: number;
    user_id?: number;
    type?: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ success: boolean; data: Transaction[]; meta: PaginatedMeta }> => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },

  /**
   * Get all orders
   */
  getOrders: async (params: {
    page?: number;
    per_page?: number;
    user_id?: number;
    type?: 'phone_number' | 'esim';
    status?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ success: boolean; data: Order[]; meta: PaginatedMeta }> => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  /**
   * Get all services
   */
  getServices: async (params: {
    category?: 'phone_number' | 'esim';
    is_active?: boolean;
  } = {}): Promise<ApiResponse<Service[]>> => {
    const response = await api.get('/admin/services', { params });
    return response.data;
  },

  /**
   * Create service
   */
  createService: async (data: {
    name: string;
    category: 'phone_number' | 'esim';
    provider: '5sim' | 'zendit';
    provider_service_code: string;
    cost_price: number;
    retail_price: number;
    reseller_price?: number;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<Service>> => {
    const response = await api.post('/admin/services', data);
    return response.data;
  },

  /**
   * Update service
   */
  updateService: async (serviceId: number, data: {
    name?: string;
    provider_service_code?: string;
    cost_price?: number;
    retail_price?: number;
    reseller_price?: number;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<Service>> => {
    const response = await api.put(`/admin/services/${serviceId}`, data);
    return response.data;
  },

  /**
   * Delete service
   */
  deleteService: async (serviceId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/services/${serviceId}`);
    return response.data;
  },

  /**
   * Get API logs
   */
  getApiLogs: async (params: {
    page?: number;
    per_page?: number;
    endpoint?: string;
    status_code?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ success: boolean; data: unknown[]; meta: PaginatedMeta }> => {
    const response = await api.get('/admin/api-logs', { params });
    return response.data;
  },

  /**
   * Get app settings
   */
  getSettings: async (group?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = group ? { group } : {};
    const response = await api.get('/admin/settings', { params });
    return response.data;
  },

  /**
   * Update app settings
   */
  updateSettings: async (settings: Array<{ key: string; value: string | number | boolean }>): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.put('/admin/settings', { settings });
    return response.data;
  },

  /**
   * Get pricing settings
   */
  getPricingSettings: async (): Promise<ApiResponse<{
    usd_to_ngn_rate: number;
    phone_markup_percentage: number;
    phone_min_price: number;
    phone_platform_fee: number;
    min_deposit: number;
    max_deposit: number;
    exchange_rate_info?: {
      rate: number;
      source: string;
      is_configured: boolean;
      default_rate: number;
    };
  }>> => {
    const response = await api.get('/admin/pricing');
    return response.data;
  },

  /**
   * Update pricing settings
   */
  updatePricingSettings: async (data: {
    usd_to_ngn_rate?: number;
    phone_markup_percentage?: number;
    phone_min_price?: number;
    phone_platform_fee?: number;
    min_deposit?: number;
    max_deposit?: number;
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.put('/admin/pricing', data);
    return response.data;
  },

  /**
   * Get payment gateways
   */
  getPaymentGateways: async (): Promise<ApiResponse<PaymentGateway[]>> => {
    const response = await api.get<ApiResponse<PaymentGateway[]>>('/admin/payment-gateways');
    return response.data;
  },

  /**
   * Update payment gateway status
   */
  updatePaymentGateway: async (
    gatewayId: string,
    data: { enabled: boolean }
  ): Promise<ApiResponse<{ gateway: string; enabled: boolean }>> => {
    const response = await api.put(`/admin/payment-gateways/${gatewayId}`, data);
    return response.data;
  },

  /**
   * Test payment gateway connection
   */
  testPaymentGateway: async (gatewayId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/admin/payment-gateways/${gatewayId}/test`);
    return response.data;
  },
};
