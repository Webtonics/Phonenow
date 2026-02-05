// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'reseller' | 'admin';
  balance: number;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// Transaction types
export interface Transaction {
  id: number;
  user_id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  payment_method: 'flutterwave' | 'admin_credit' | 'refund' | null;
  flutterwave_ref: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Service types
export interface Service {
  id: number;
  category: 'phone_number' | 'esim';
  name: string;
  provider: '5sim' | 'zendit';
  provider_service_code: string;
  cost_price: number;
  retail_price: number;
  reseller_price: number | null;
  is_active: boolean;
  metadata: ServiceMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceMetadata {
  country?: string;
  operator?: string;
  platform?: string;
  type?: string;
  quantity?: number;
  speed?: string;
}

// Order types
export interface Order {
  id: number;
  user_id: number;
  service_id: number;
  order_number: string;
  type: 'phone_number' | 'esim';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  amount_paid: number;
  provider: '5sim' | 'zendit';
  provider_order_id: string | null;
  // Phone number fields
  phone_number: string | null;
  sms_code: string | null;
  sms_text: string | null;
  product_name: string | null;
  country_code: string | null;
  // Common
  completed_at: string | null;
  expires_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  service?: Service;
  user?: User;
}

// Country type for phone numbers
export interface Country {
  code: string;
  name: string;
  flag: string;
}

// Wallet types
export interface WalletBalance {
  balance: number;
  currency: string;
  last_transaction: Transaction | null;
}

export interface FundWalletResponse {
  link: string;
  tx_ref: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    [key: string]: T[];
  } & {
    pagination: Pagination;
  };
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

// Admin Dashboard Stats
export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_orders: number;
  total_revenue: number;
  failed_orders: number;
  active_orders: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  recent_orders: Order[];
  recent_transactions: Transaction[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  ref?: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfileForm {
  name: string;
  phone: string;
}

export interface FundWalletForm {
  amount: number;
}

export interface PhonePurchaseForm {
  service_id: number;
}

export interface AdminCreditUserForm {
  amount: number;
  reason?: string;
}

export interface AdminUpdateServiceForm {
  name?: string;
  cost_price?: number;
  retail_price?: number;
  reseller_price?: number;
  is_active?: boolean;
}

// Re-export eSIM types
export * from './esim';
