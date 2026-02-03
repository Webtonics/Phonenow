import { useState, useEffect } from 'react';
import {
  Settings,
  Loader2,
  Save,
  RefreshCw,
  DollarSign,
  Percent,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

interface PricingSettings {
  phone_markup_percentage: number;
  phone_exchange_rate: number;
  phone_min_price: number;
  phone_platform_fee: number;
  min_deposit: number;
  max_deposit: number;
  current_exchange_rate?: number;
}

export const AdminServicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PricingSettings>({
    phone_markup_percentage: 200,
    phone_exchange_rate: 0,
    phone_min_price: 500,
    phone_platform_fee: 0,
    min_deposit: 1000,
    max_deposit: 1000000,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await adminService.getPricingSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await adminService.updatePricingSettings({
        phone_markup_percentage: settings.phone_markup_percentage,
        phone_exchange_rate: settings.phone_exchange_rate,
        phone_min_price: settings.phone_min_price,
        phone_platform_fee: settings.phone_platform_fee,
        min_deposit: settings.min_deposit,
        max_deposit: settings.max_deposit,
      });
      if (response.success) {
        toast.success('Pricing settings updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update pricing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PricingSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Pricing</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            className="btn-outline text-sm py-2 px-4 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Current Exchange Rate Info */}
      {settings.current_exchange_rate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Current Live Exchange Rate</p>
              <p className="text-sm text-blue-700">1 USD = ₦{settings.current_exchange_rate?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Phone Number Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Phone Number Pricing</h2>
              <p className="text-sm text-gray-500">Configure pricing for phone number services</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-gray-400" />
                  Markup Percentage (%)
                </div>
              </label>
              <input
                type="number"
                value={settings.phone_markup_percentage}
                onChange={(e) => handleChange('phone_markup_percentage', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="e.g. 200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Price multiplier applied to cost price (200 = 2x markup)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  Custom Exchange Rate (USD to NGN)
                </div>
              </label>
              <input
                type="number"
                value={settings.phone_exchange_rate}
                onChange={(e) => handleChange('phone_exchange_rate', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="Leave 0 to use live rate"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set to 0 to use live exchange rate automatically
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Minimum Price (₦)
                </div>
              </label>
              <input
                type="number"
                value={settings.phone_min_price}
                onChange={(e) => handleChange('phone_min_price', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="e.g. 500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum price for any phone number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Platform Fee (₦)
                </div>
              </label>
              <input
                type="number"
                value={settings.phone_platform_fee}
                onChange={(e) => handleChange('phone_platform_fee', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="e.g. 0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fixed fee added to every purchase
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Wallet Settings</h2>
              <p className="text-sm text-gray-500">Configure deposit limits</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Deposit (₦)
              </label>
              <input
                type="number"
                value={settings.min_deposit}
                onChange={(e) => handleChange('min_deposit', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="e.g. 1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum amount users can deposit at once
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Deposit (₦)
              </label>
              <input
                type="number"
                value={settings.max_deposit}
                onChange={(e) => handleChange('max_deposit', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                placeholder="e.g. 1000000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount users can deposit at once
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Calculator Preview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">5SIM Cost (USD)</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">In NGN (at rate)</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">After Markup</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">+ Platform Fee</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Final Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[0.10, 0.25, 0.50, 1.00, 2.00, 5.00].map((cost) => {
                  const rate = settings.phone_exchange_rate > 0
                    ? settings.phone_exchange_rate
                    : (settings.current_exchange_rate || 1600);
                  const inNgn = cost * rate;
                  const afterMarkup = inNgn * (settings.phone_markup_percentage / 100);
                  const withFee = afterMarkup + settings.phone_platform_fee;
                  const final = Math.max(withFee, settings.phone_min_price);

                  return (
                    <tr key={cost} className="hover:bg-gray-50">
                      <td className="px-4 py-2">${cost.toFixed(2)}</td>
                      <td className="px-4 py-2">₦{inNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-2">₦{afterMarkup.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-2">₦{withFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-2 font-semibold text-primary-600">₦{final.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * Using exchange rate: ₦{(settings.phone_exchange_rate > 0 ? settings.phone_exchange_rate : (settings.current_exchange_rate || 1600)).toLocaleString()} per USD
          </p>
        </div>
      </div>
    </div>
  );
};
