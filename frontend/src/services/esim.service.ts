import api from './api';
import type { ApiResponse } from '@/types';
import type {
  ESIMPackage,
  ESIMProfile,
  ESIMCountry,
  ESIMPackageFilters,
  ESIMQRCodeData,
} from '@/types/esim';

export const esimService = {
  // =========================================================================
  // BROWSE PACKAGES
  // =========================================================================

  /**
   * Get all available eSIM packages with optional filters
   */
  getPackages: async (filters?: ESIMPackageFilters) => {
    return api.get<ApiResponse<ESIMPackage[]>>('/esim/packages', { params: filters });
  },

  /**
   * Get packages for a specific country
   */
  getPackagesByCountry: async (countryCode: string) => {
    return api.get<ApiResponse<ESIMPackage[]>>(`/esim/packages/${countryCode}`);
  },

  /**
   * Get single package details
   */
  getPackage: async (id: number) => {
    return api.get<ApiResponse<ESIMPackage>>(`/esim/package/${id}`);
  },

  /**
   * Get popular packages
   */
  getPopularPackages: async () => {
    return api.get<ApiResponse<ESIMPackage[]>>('/esim/popular');
  },

  /**
   * Get supported countries
   */
  getCountries: async () => {
    return api.get<ApiResponse<ESIMCountry[]>>('/esim/countries');
  },

  /**
   * Get available regions
   */
  getRegions: async () => {
    return api.get<ApiResponse<string[]>>('/esim/regions');
  },

  // =========================================================================
  // PURCHASE & TOPUP
  // =========================================================================

  /**
   * Purchase an eSIM profile
   */
  purchaseProfile: async (packageId: number) => {
    return api.post<ApiResponse<{ profile: ESIMProfile; new_balance: number }>>('/esim/purchase', {
      package_id: packageId,
    });
  },

  /**
   * Top-up data on an existing eSIM
   */
  topUpData: async (profileId: number, packageId: number) => {
    return api.post<ApiResponse<{ subscription: any; profile: ESIMProfile; new_balance: number }>>(
      `/esim/topup/${profileId}`,
      { package_id: packageId }
    );
  },

  // =========================================================================
  // MY ESIMS
  // =========================================================================

  /**
   * Get user's eSIM profiles
   */
  getMyProfiles: async (status?: string) => {
    return api.get<ApiResponse<ESIMProfile[]>>('/esim/my-profiles', {
      params: status ? { status } : undefined,
    });
  },

  /**
   * Get specific eSIM profile details
   */
  getProfile: async (id: number) => {
    return api.get<ApiResponse<ESIMProfile>>(`/esim/profile/${id}`);
  },

  /**
   * Get QR code for eSIM activation
   */
  getQrCode: async (id: number) => {
    return api.get<ApiResponse<ESIMQRCodeData>>(`/esim/profile/${id}/qrcode`);
  },

  /**
   * Refresh/check eSIM status from Zendit
   */
  refreshStatus: async (id: number) => {
    return api.post<ApiResponse<{ profile: ESIMProfile; zendit_status: string }>>(
      `/esim/profile/${id}/refresh`
    );
  },

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Cancel eSIM and get refund
   */
  cancelProfile: async (id: number) => {
    return api.post<ApiResponse<{ refunded_amount: number; new_balance: number }>>(
      `/esim/cancel/${id}`
    );
  },

  /**
   * Update usage statistics
   */
  updateUsage: async (id: number) => {
    return api.post<ApiResponse<any>>(`/esim/update-usage/${id}`);
  },

  // =========================================================================
  // UTILITY
  // =========================================================================

  /**
   * Get Zendit API balance (for debugging)
   */
  getBalance: async () => {
    return api.get<ApiResponse<{ balance: number; currency: string }>>('/esim/balance');
  },

  /**
   * Format price in Naira
   */
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format data amount
   */
  formatData: (mb: number, unlimited: boolean = false): string => {
    if (unlimited) return 'Unlimited';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  },

  /**
   * Format duration
   */
  formatDuration: (days: number): string => {
    if (days === 1) return '1 day';
    if (days === 7) return '1 week';
    if (days === 14) return '2 weeks';
    if (days === 30) return '1 month';
    if (days === 60) return '2 months';
    if (days === 90) return '3 months';
    if (days === 365) return '1 year';
    return `${days} days`;
  },
};
