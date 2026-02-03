import { useState, useEffect } from 'react';
import {
  Settings,
  Loader2,
  Save,
  RefreshCw,
  Phone,
  Wallet,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import { getErrorMessage } from '@/services/api';

interface PricingSettings {
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
}

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<PricingSettings>({
    usd_to_ngn_rate: 1600,
    phone_markup_percentage: 200,
    phone_min_price: 500,
    phone_platform_fee: 0,
    min_deposit: 1000,
    max_deposit: 1000000,
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
      if (response.success && response.data) {
        // Merge with defaults to handle missing fields
        setSettings(prev => ({
          ...prev,
          ...response.data,
          // Ensure usd_to_ngn_rate has a value
          usd_to_ngn_rate: response.data.usd_to_ngn_rate || prev.usd_to_ngn_rate,
        }));
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
      const { exchange_rate_info, ...settingsToSave } = settings;
      const response = await adminService.updatePricingSettings(settingsToSave);
      if (response.success) {
        toast.success('Settings saved successfully');
        fetchSettings(); // Refresh to get updated info
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

  // Calculate example price
  const exampleApiCostUsd = 0.15; // Example: $0.15 API cost
  const priceInNgn = exampleApiCostUsd * settings.usd_to_ngn_rate;
  const markupMultiplier = settings.phone_markup_percentage / 100;
  const finalPrice = Math.max(
    (priceInNgn * markupMultiplier) + settings.phone_platform_fee,
    settings.phone_min_price
  );

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

      {/* Exchange Rate - Most Important */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-primary-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Exchange Rate (USD to NGN)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          This rate is used to convert API costs (in USD) to Nigerian Naira for billing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1 USD = ? NGN
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.usd_to_ngn_rate}
                onChange={(e) => handleChange('usd_to_ngn_rate', e.target.value)}
                min="100"
                max="10000"
                step="10"
                className="input-field pl-8 text-lg font-semibold"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Example: 1600 means $1 = ₦1,600
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Current Status</p>
            {settings.exchange_rate_info?.is_configured ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Configured (Manual)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Using Default Rate</span>
              </div>
            )}
            <p className="text-2xl font-bold text-gray-900 mt-2">
              $1 = ₦{settings.usd_to_ngn_rate.toLocaleString()}
            </p>
          </div>
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
                max="5000"
                step="10"
                className="input-field pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {settings.phone_markup_percentage}% = {(settings.phone_markup_percentage / 100).toFixed(1)}x cost
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
            <p className="text-xs text-gray-500 mt-1">
              Prices below this will be set to ₦{settings.phone_min_price.toLocaleString()}
            </p>
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
            <p className="text-xs text-gray-500 mt-1">
              Additional flat fee added to each transaction
            </p>
          </div>
        </div>

        {/* Pricing Example */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Pricing Example</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>API Cost: <span className="font-mono">${exampleApiCostUsd.toFixed(2)}</span></p>
            <p>In NGN: <span className="font-mono">${exampleApiCostUsd.toFixed(2)} × ₦{settings.usd_to_ngn_rate.toLocaleString()} = ₦{priceInNgn.toFixed(2)}</span></p>
            <p>With {settings.phone_markup_percentage}% markup: <span className="font-mono">₦{priceInNgn.toFixed(2)} × {markupMultiplier} = ₦{(priceInNgn * markupMultiplier).toFixed(2)}</span></p>
            {settings.phone_platform_fee > 0 && (
              <p>+ Platform fee: <span className="font-mono">₦{settings.phone_platform_fee}</span></p>
            )}
            <p className="font-bold text-blue-900 pt-2 border-t border-blue-200">
              Final Price: ₦{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          Settings Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Exchange Rate</p>
            <p className="text-lg font-bold text-green-900">₦{settings.usd_to_ngn_rate.toLocaleString()}/USD</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Phone Markup</p>
            <p className="text-lg font-bold text-blue-900">{settings.phone_markup_percentage}%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Min Price</p>
            <p className="text-lg font-bold text-purple-900">₦{settings.phone_min_price.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-600 font-medium">Platform Fee</p>
            <p className="text-lg font-bold text-amber-900">₦{settings.phone_platform_fee.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
