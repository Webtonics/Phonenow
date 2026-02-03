import api from './api';
import {
  User,
  ApiResponse,
  AuthResponse,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  ChangePasswordForm,
  UpdateProfileForm,
} from '@/types';

export const authService = {
  /**
   * Register a new user
   * Note: We store the token so user can resend verification emails,
   * but they won't be considered "logged in" until they verify their email
   */
  register: async (data: RegisterForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.success && response.data.data?.token) {
      // Store token for resend verification functionality
      localStorage.setItem('auth_token', response.data.data.token);
      // Store user data for verification pending page
      localStorage.setItem('pending_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   */
  getUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/user');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileForm): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordForm): Promise<ApiResponse<null>> => {
    const response = await api.put<ApiResponse<null>>('/auth/password', data);
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordForm): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordForm): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/verify-email', { token });
    return response.data;
  },

  /**
   * Resend verification email
   */
  resendVerification: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/resend-verification');
    return response.data;
  },

  /**
   * Get dashboard stats
   */
  getDashboard: async (): Promise<ApiResponse<{
    total_spent: number;
    total_orders: number;
    active_orders: number;
    completed_orders: number;
    recent_orders: Array<{
      id: number;
      order_number: string;
      type: string;
      status: string;
      amount_paid: number;
      product_name: string | null;
      phone_number: string | null;
      created_at: string;
    }>;
  }>> => {
    const response = await api.get('/auth/dashboard');
    return response.data;
  },

  /**
   * Check if user is authenticated (client-side)
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get stored user (client-side)
   */
  getStoredUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored token (client-side)
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
};
