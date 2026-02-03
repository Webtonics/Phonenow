// eSIM Package Types (Zendit)
export interface ESIMPackage {
  id: number;
  offer_id: string | null;
  package_code: string;
  brand: string | null;
  country_code: string;
  country_name: string;
  country_flag: string;
  region: string | null;
  regions: string[] | null;

  // Data
  data_amount: number; // in MB
  data_gb: number | null; // in GB
  data_formatted: string; // e.g., "1 GB", "Unlimited"
  data_unlimited: boolean;

  // Duration
  duration_days: number;
  duration_formatted: string; // e.g., "7 days"

  // Network
  network_type: string; // e.g., "4G/5G"
  data_speeds: string[] | null; // e.g., ["4G", "5G"]
  speeds_formatted: string;

  // Voice & SMS
  voice_minutes: number | null;
  voice_unlimited: boolean;
  voice_formatted: string | null;
  has_voice: boolean;
  sms_number: number | null;
  sms_unlimited: boolean;
  sms_formatted: string | null;
  has_sms: boolean;

  // Roaming
  roaming_countries: string[] | null;
  has_roaming: boolean;

  // Pricing
  price_usd: number | null;
  selling_price: number;

  // Classification
  package_type: 'profile' | 'topup';
  is_popular: boolean;
}

// eSIM Profile Types (Zendit)
export interface ESIMProfile {
  id: number;
  order_no: string;
  transaction_id: string | null;
  iccid: string | null;

  // QR Code & Activation
  qr_code_data: string | null; // LPA string
  qr_code_url: string | null;
  lpa_string: string | null;
  smdp_address: string | null;
  activation_code: string | null;

  // Location
  country_code: string;
  country_name: string;
  country_flag: string;

  // Data
  data_amount: number;
  data_formatted: string;
  duration_days: number;

  // Voice & SMS
  voice_minutes: number | null;
  voice_unlimited: boolean;
  voice_formatted: string | null;
  has_voice: boolean;
  sms_number: number | null;
  sms_unlimited: boolean;
  sms_formatted: string | null;
  has_sms: boolean;

  // Pricing
  selling_price: number;

  // Status
  status: 'new' | 'active' | 'expired' | 'cancelled' | 'pending' | 'processing' | 'failed';
  zendit_status: string | null;
  is_active: boolean;
  can_topup: boolean;
  total_data_remaining: number;

  // Dates
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;

  // Instructions
  redemption_instructions: string | null;

  // Subscriptions
  subscriptions_count?: number;
  subscriptions?: ESIMSubscription[];
}

// eSIM Subscription (Data Bundle)
export interface ESIMSubscription {
  id: number;
  package_code: string;
  data_amount: number;
  data_formatted: string;
  data_used: number;
  data_remaining: number;
  data_remaining_formatted: string;
  usage_percentage: number;
  is_low_data: boolean;
  selling_price: number;
  status: 'active' | 'expired';
  zendit_status: string | null;
  activated_at: string;
  expires_at: string;
  created_at: string;
}

// Country
export interface ESIMCountry {
  code: string;
  name: string;
  flag: string;
}

// QR Code Response
export interface ESIMQRCodeData {
  qr_code_url: string | null;
  qr_code_data: string | null;
  lpa_string: string | null;
}

// API Response Types
export interface ESIMPackagesResponse {
  success: boolean;
  data: ESIMPackage[];
}

export interface ESIMProfilesResponse {
  success: boolean;
  data: ESIMProfile[];
}

export interface ESIMProfileResponse {
  success: boolean;
  data: ESIMProfile;
}

export interface ESIMCountriesResponse {
  success: boolean;
  data: ESIMCountry[];
}

export interface ESIMRegionsResponse {
  success: boolean;
  data: string[];
}

export interface ESIMPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    profile: ESIMProfile;
    new_balance: number;
  };
}

export interface ESIMTopUpResponse {
  success: boolean;
  message: string;
  data: {
    subscription: ESIMSubscription;
    profile: ESIMProfile;
    new_balance: number;
  };
}

export interface ESIMCancelResponse {
  success: boolean;
  message: string;
  data: {
    refunded_amount: number;
    new_balance: number;
  };
}

export interface ESIMQRCodeResponse {
  success: boolean;
  data: ESIMQRCodeData;
}

export interface ESIMRefreshResponse {
  success: boolean;
  message: string;
  data: {
    profile: ESIMProfile;
    zendit_status: string;
  };
}

export interface ESIMBalanceResponse {
  success: boolean;
  data: {
    balance: number;
    currency: string;
  };
}

// Filter types
export interface ESIMPackageFilters {
  country?: string;
  region?: string;
  type?: 'profile' | 'topup';
  search?: string;
  sort?: 'price' | 'popular' | 'data' | 'price_high';
  has_voice?: boolean;
  has_sms?: boolean;
}

// Status badge helpers
export type ESIMStatusType = ESIMProfile['status'];

export const getStatusColor = (status: ESIMStatusType): string => {
  const colors: Record<ESIMStatusType, string> = {
    new: 'bg-info-100 text-info-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: ESIMStatusType): string => {
  const labels: Record<ESIMStatusType, string> = {
    new: 'New',
    pending: 'Pending',
    processing: 'Processing',
    active: 'Active',
    expired: 'Expired',
    cancelled: 'Cancelled',
    failed: 'Failed',
  };
  return labels[status] || status;
};
