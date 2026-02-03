import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Wifi,
  RefreshCw,
  DollarSign,
  Settings,
  Package,
  TrendingUp,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api, getErrorMessage } from '@/services';

interface ESIMStats {
  total_packages: number;
  active_packages: number;
  countries_count: number;
  popular_packages: number;
  total_purchases: number;
}

interface ESIMSettings {
  pricing: {
    profile_markup: number;
    data_markup: number;
    exchange_rate: number;
    min_purchase_amount: number;
  };
  configuration: {
    auto_sync: boolean;
    sync_frequency_hours: number;
    low_data_threshold: number;
    expiry_warning_days: number;
    enable_usage_notifications: boolean;
    max_profiles_per_user: number;
  };
}

interface ESIMPackage {
  id: number;
  package_code: string | null;
  country_name: string | null;
  data_amount: number | null;
  duration_days: number | null;
  wholesale_price: number | null;
  selling_price: number | null;
  markup_percentage: number | string | null;
  is_active: boolean;
  purchase_count: number | null;
}

export function AdminESIMPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'settings'>('overview');
  const [stats, setStats] = useState<ESIMStats | null>(null);
  const [settings, setSettings] = useState<ESIMSettings | null>(null);
  const [packages, setPackages] = useState<ESIMPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [apiBalance, setApiBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
    fetchSettings();
    testConnection();
    if (activeTab === 'packages') {
      fetchPackages();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/esim/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/esim/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/esim/packages');
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await api.get('/admin/esim/test-connection');
      setApiConnected(response.data.success);

      if (response.data.success) {
        const balanceResponse = await api.get('/admin/esim/balance');
        if (balanceResponse.data.success) {
          setApiBalance(balanceResponse.data.data.balance);
        }
      }
    } catch (error) {
      setApiConnected(false);
    }
  };

  const handleSyncPackages = async () => {
    setSyncing(true);
    toast.info('Syncing packages from Zendit... This may take a few minutes.');
    try {
      // Use longer timeout for sync operation (5 minutes)
      const response = await api.post('/admin/esim/sync-packages', {}, {
        timeout: 300000, // 5 minutes
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchStats();
        if (activeTab === 'packages') {
          await fetchPackages();
        }
      } else {
        toast.error(response.data.message || 'Sync failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Flatten the nested structure for the API
      const payload = {
        profile_markup: settings.pricing.profile_markup,
        data_markup: settings.pricing.data_markup,
        exchange_rate: settings.pricing.exchange_rate,
        min_purchase_amount: settings.pricing.min_purchase_amount,
        auto_sync: settings.configuration.auto_sync,
        sync_frequency_hours: settings.configuration.sync_frequency_hours,
        low_data_threshold: settings.configuration.low_data_threshold,
        expiry_warning_days: settings.configuration.expiry_warning_days,
        enable_usage_notifications: settings.configuration.enable_usage_notifications,
        max_profiles_per_user: settings.configuration.max_profiles_per_user,
      };

      const response = await api.put('/admin/esim/settings', payload);
      if (response.data.success) {
        toast.success('Settings saved successfully');
        // Refresh to apply new pricing
        await fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePackage = async (id: number, currentStatus: boolean) => {
    try {
      const response = await api.put(`/admin/esim/package/${id}`, {
        is_active: !currentStatus,
      });
      if (response.data.success) {
        toast.success('Package updated');
        await fetchPackages();
      } else {
        toast.error(response.data.message || 'Failed to update package');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">eSIM Management</h1>
          <p className="mt-1 text-gray-600">Manage eSIM packages, pricing, and settings</p>
        </div>
        <button
          onClick={handleSyncPackages}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
          Sync Packages
        </button>
      </div>

      {/* API Connection Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {apiConnected === true && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">API Connected</p>
                  <p className="text-sm text-gray-600">
                    Balance: ${apiBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </>
            )}
            {apiConnected === false && (
              <>
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">API Disconnected</p>
                  <p className="text-sm text-gray-600">Check your API credentials</p>
                </div>
              </>
            )}
            {apiConnected === null && (
              <>
                <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                <p className="font-medium text-gray-900">Testing connection...</p>
              </>
            )}
          </div>
          <button
            onClick={testConnection}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Retest
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'packages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Packages
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-6 text-white">
                <Package className="h-8 w-8 mb-3 opacity-80" />
                <p className="text-sm opacity-80">Total Packages</p>
                <p className="text-3xl font-bold mt-1">{stats.total_packages}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <CheckCircle className="h-8 w-8 mb-3 opacity-80" />
                <p className="text-sm opacity-80">Active Packages</p>
                <p className="text-3xl font-bold mt-1">{stats.active_packages}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <Globe className="h-8 w-8 mb-3 opacity-80" />
                <p className="text-sm opacity-80">Countries</p>
                <p className="text-3xl font-bold mt-1">{stats.countries_count}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
                <p className="text-sm opacity-80">Total Purchases</p>
                <p className="text-3xl font-bold mt-1">{stats.total_purchases}</p>
              </div>
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Package Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Country
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Wholesale
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Selling Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Markup
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Sales
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            {pkg.package_code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {pkg.country_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {((pkg.data_amount || 0) / 1024).toFixed(2)} GB
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {pkg.duration_days || 0} days
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₦{(pkg.wholesale_price || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ₦{(pkg.selling_price || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {(Number(pkg.markup_percentage) || 0).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {pkg.purchase_count || 0}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTogglePackage(pkg.id, pkg.is_active)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pkg.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-8">
              {/* Pricing Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Pricing Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Markup (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="500"
                      value={settings.pricing.profile_markup}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pricing: { ...settings.pricing, profile_markup: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Markup on cost price (e.g., 100% = 2x cost price)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Top-up Markup (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="500"
                      value={settings.pricing.data_markup}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pricing: { ...settings.pricing, data_markup: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Markup for data top-up packages
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      USD to NGN Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      value={settings.pricing.exchange_rate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pricing: { ...settings.pricing, exchange_rate: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1 USD = X NGN (used to calculate selling prices)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Amount (₦)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={settings.pricing.min_purchase_amount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pricing: { ...settings.pricing, min_purchase_amount: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum wallet balance required to purchase
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary-600" />
                  Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Data Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.configuration.low_data_threshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, low_data_threshold: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Notify users when data drops below this %
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Warning (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.configuration.expiry_warning_days}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, expiry_warning_days: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Notify users X days before eSIM expires
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Profiles Per User
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.configuration.max_profiles_per_user}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, max_profiles_per_user: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum eSIM profiles a user can have
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Frequency (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.configuration.sync_frequency_hours}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, sync_frequency_hours: Number(e.target.value) }
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-sync packages from Zendit every X hours
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto_sync"
                      checked={settings.configuration.auto_sync}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, auto_sync: e.target.checked }
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto_sync" className="text-sm font-medium text-gray-700">
                      Enable Auto-Sync Packages
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="usage_notifications"
                      checked={settings.configuration.enable_usage_notifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          configuration: { ...settings.configuration, enable_usage_notifications: e.target.checked }
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="usage_notifications" className="text-sm font-medium text-gray-700">
                      Enable Usage Notifications
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={fetchSettings}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
