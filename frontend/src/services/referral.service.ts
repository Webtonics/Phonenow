import api from './api';
import { ApiResponse } from '@/types';

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  pending_earnings: number;
  available_to_withdraw: number;
}

export interface ReferralDashboard {
  stats: ReferralStats;
  referral_code: string;
  referral_link: string;
}

export interface ReferralUser {
  id: number;
  referrer_id: number;
  referee_id: number;
  referral_code: string;
  status: 'pending' | 'active' | 'expired';
  purchase_count: number;
  total_commission_earned: number;
  created_at: string;
  updated_at: string;
  referee: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
}

export interface ReferralCommission {
  id: number;
  referral_id: number;
  referrer_id: number;
  referee_id: number;
  transaction_id: number | null;
  transaction_type: string;
  transaction_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  referee: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const referralService = {
  /**
   * Get referral dashboard with stats
   */
  getDashboard: async (): Promise<ApiResponse<ReferralDashboard>> => {
    const response = await api.get<ApiResponse<ReferralDashboard>>('/referrals');
    return response.data;
  },

  /**
   * Get referral code and link
   */
  getCode: async (): Promise<ApiResponse<{ code: string; link: string }>> => {
    const response = await api.get<ApiResponse<{ code: string; link: string }>>('/referrals/code');
    return response.data;
  },

  /**
   * Get list of referrals
   */
  getReferrals: async (params: {
    page?: number;
    per_page?: number;
  } = {}): Promise<{ success: boolean; data: ReferralUser[]; meta: PaginatedMeta }> => {
    const response = await api.get('/referrals/list', { params });
    return response.data;
  },

  /**
   * Get commission history
   */
  getCommissions: async (params: {
    page?: number;
    per_page?: number;
  } = {}): Promise<{ success: boolean; data: ReferralCommission[]; meta: PaginatedMeta }> => {
    const response = await api.get('/referrals/commissions', { params });
    return response.data;
  },

  /**
   * Request withdrawal
   */
  requestWithdrawal: async (amount: number): Promise<ApiResponse<{ amount: number; status: string }>> => {
    const response = await api.post<ApiResponse<{ amount: number; status: string }>>('/referrals/withdraw', { amount });
    return response.data;
  },
};
