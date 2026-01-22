import { useState, useEffect } from 'react';
import {
  Settings,
  Loader2,
  Save,
  RefreshCw,
  Phone,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import { getErrorMessage } from '@/services/api';

interface PricingSettings {
  phone_markup_percentage: number;
  phone_min_price: number;
  phone_platform_fee: number;
  smm_markup_percentage: number;
  min_deposit: number;
  max_deposit: number;
  current_exchange_rate?: number; // Read-only, fetched automatically
}

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<PricingSettings>({
    phone_markup_percentage: 1000,
    phone_min_price: 500,
    phone_platform_fee: 0,
    smm_markup_percentage: 500,
    min_deposit: 1000,
    max_deposit: 1000000,
    current_exchange_rate: 1600,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await adminService.getPricingSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await adminService.updatePricingSettings(settings);
      if (response.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof PricingSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, [key]: numValue }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Phone Number Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary-500" />
          Phone Number Pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markup Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.phone_markup_percentage}
                onChange={(e) => handleChange('phone_markup_percentage', e.target.value)}
                min="100"
                max="10000"
                step="10"
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1000% = 10x cost
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exchange Rate (USD → NGN)
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.current_exchange_rate || 1600}
                disabled
                className="input-field bg-gray-50 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
                Auto-updated
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live rate: 1 USD = ₦{settings.current_exchange_rate?.toLocaleString() || '1,600'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Price (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.phone_min_price}
                onChange={(e) => handleChange('phone_min_price', e.target.value)}
                min="0"
                max="100000"
                step="50"
                className="input-field pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Fee (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.phone_platform_fee}
                onChange={(e) => handleChange('phone_platform_fee', e.target.value)}
                min="0"
                max="10000"
                step="10"
                className="input-field pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SMM Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary-500" />
          SMM Services Pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMM Markup Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.smm_markup_percentage}
                onChange={(e) => handleChange('smm_markup_percentage', e.target.value)}
                min="100"
                max="10000"
                step="10"
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              500% = 5x cost
            </p>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent-500" />
          Payment Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Deposit (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.min_deposit}
                onChange={(e) => handleChange('min_deposit', e.target.value)}
                min="100"
                step="100"
                className="input-field pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Deposit (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.max_deposit}
                onChange={(e) => handleChange('max_deposit', e.target.value)}
                min="1000"
                step="1000"
                className="input-field pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          Current Settings
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Phone Markup</p>
            <p className="text-lg font-bold text-gray-900">{settings.phone_markup_percentage}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Exchange Rate</p>
            <p className="text-lg font-bold text-gray-900">₦{settings.current_exchange_rate?.toLocaleString() || '1,600'}/USD</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Min Price</p>
            <p className="text-lg font-bold text-gray-900">₦{settings.phone_min_price.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">SMM Markup</p>
            <p className="text-lg font-bold text-gray-900">{settings.smm_markup_percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
