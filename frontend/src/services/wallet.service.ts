import api from './api';
import {
  ApiResponse,
  PaymentMethod,
  Transaction,
} from '@/types';

interface WalletData {
  balance: number;
  currency: string;
  recent_transactions: Transaction[];
}

interface FundingResponse {
  reference: string;
  link: string;
}

interface VerifyResponse {
  status: string;
  amount: number;
  balance: number;
}

interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const walletService = {
  /**
   * Get wallet balance and recent transactions
   */
  getWallet: async (): Promise<ApiResponse<WalletData>> => {
    const response = await api.get<ApiResponse<WalletData>>('/wallet');
    return response.data;
  },

  /**
   * Initiate wallet funding with selected payment provider
   */
  fundWallet: async (
    amount: number,
    paymentProvider: 'flutterwave' | 'cryptomus' | 'korapay'
  ): Promise<ApiResponse<FundingResponse>> => {
    const response = await api.post<ApiResponse<FundingResponse>>('/wallet/fund', {
      amount,
      payment_provider: paymentProvider,
    });
    return response.data;
  },

  /**
   * Verify payment after Flutterwave redirect
   */
  verifyPayment: async (reference: string, transactionId?: string): Promise<ApiResponse<VerifyResponse>> => {
    const response = await api.post<ApiResponse<VerifyResponse>>('/wallet/verify', {
      reference,
      transaction_id: transactionId,
    });
    return response.data;
  },

  /**
   * Get transaction history
   */
  getTransactions: async (params: {
    page?: number;
    per_page?: number;
    type?: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  } = {}): Promise<TransactionsResponse> => {
    const response = await api.get<TransactionsResponse>('/wallet/transactions', { params });
    return response.data;
  },

  /**
   * Get single transaction by reference
   */
  getTransaction: async (reference: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.get<ApiResponse<Transaction>>(`/wallet/transactions/${reference}`);
    return response.data;
  },

  /**
   * Get available payment methods (enabled + configured gateways)
   */
  getPaymentMethods: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/wallet/payment-methods');
    return response.data;
  },
};
