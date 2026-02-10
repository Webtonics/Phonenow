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
  Clock,
  XCircle,
  Send,
  User,
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
    fulfillment_mode: 'auto' | 'manual';
  };
}

interface FulfillmentOrder {
  id: number;
  order_no: string;
  user: { id: number; name: string; email: string };
  country_code: string;
  country_name: string;
  package_code: string;
  data_amount: number;
  data_formatted: string;
  duration_days: number;
  selling_price: number;
  wholesale_price: number;
  profit: number;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'fulfillment' | 'settings'>('overview');
  const [stats, setStats] = useState<ESIMStats | null>(null);
  const [settings, setSettings] = useState<ESIMSettings | null>(null);
  const [packages, setPackages] = useState<ESIMPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [apiBalance, setApiBalance] = useState<number | null>(null);

  // Fulfillment state
  const [fulfillmentQueue, setFulfillmentQueue] = useState<FulfillmentOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [fulfillModalOrder, setFulfillModalOrder] = useState<FulfillmentOrder | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<FulfillmentOrder | null>(null);
  const [fulfillForm, setFulfillForm] = useState({ iccid: '', smdp_address: '', activation_code: '', qr_code_url: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [fulfilling, setFulfilling] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSettings();
    testConnection();
    fetchFulfillmentQueue();
    if (activeTab === 'packages') {
      fetchPackages();
    }
    if (activeTab === 'fulfillment') {
      fetchFulfillmentQueue();
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
        fulfillment_mode: settings.configuration.fulfillment_mode,
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

  const fetchFulfillmentQueue = async () => {
    try {
      const response = await api.get('/admin/esim/fulfillment-queue');
      if (response.data.success) {
        setFulfillmentQueue(response.data.data);
        setPendingCount(response.data.meta.pending_count);
      }
    } catch (error) {
      console.error('Failed to fetch fulfillment queue:', error);
    }
  };

  const handleFulfillOrder = async () => {
    if (!fulfillModalOrder) return;
    setFulfilling(true);
    try {
      const response = await api.post(`/admin/esim/fulfill/${fulfillModalOrder.id}`, fulfillForm);
      if (response.data.success) {
        toast.success(response.data.message);
        setFulfillModalOrder(null);
        setFulfillForm({ iccid: '', smdp_address: '', activation_code: '', qr_code_url: '' });
        await fetchFulfillmentQueue();
      } else {
        toast.error(response.data.message || 'Fulfillment failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setFulfilling(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectModalOrder) return;
    setRejecting(true);
    try {
      const response = await api.post(`/admin/esim/reject/${rejectModalOrder.id}`, { reason: rejectReason });
      if (response.data.success) {
        toast.success(response.data.message);
        setRejectModalOrder(null);
        setRejectReason('');
        await fetchFulfillmentQueue();
      } else {
        toast.error(response.data.message || 'Rejection failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRejecting(false);
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
              onClick={() => setActiveTab('fulfillment')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'fulfillment'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fulfillment
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
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

          {/* Fulfillment Tab */}
          {activeTab === 'fulfillment' && (
            <div>
              {fulfillmentQueue.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No orders awaiting fulfillment.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-amber-600">{fulfillmentQueue.length}</span> order{fulfillmentQueue.length !== 1 ? 's' : ''} awaiting fulfillment
                    </p>
                    <button
                      onClick={fetchFulfillmentQueue}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {fulfillmentQueue.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-mono text-gray-900">{order.order_no}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                              <p className="text-xs text-gray-500">{order.user.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-900">{order.country_name}</p>
                              <p className="text-xs text-gray-500">{order.data_formatted} / {order.duration_days} days</p>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              ₦{order.selling_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-green-600 font-medium">
                              ₦{order.profit.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setFulfillModalOrder(order);
                                    setFulfillForm({ iccid: '', smdp_address: '', activation_code: '', qr_code_url: '' });
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                  <Send className="h-3 w-3" />
                                  Fulfill
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalOrder(order);
                                    setRejectReason('');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Fulfill Modal */}
              {fulfillModalOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setFulfillModalOrder(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <Send className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Fulfill Order</h3>
                          <p className="text-green-100 text-sm">Enter the eSIM credentials from Zendit</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Order Summary Card */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">{fulfillModalOrder.user.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">{fulfillModalOrder.user.email}</p>
                          </div>
                          <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{fulfillModalOrder.order_no}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary-500" />
                            <span className="text-sm text-gray-700">{fulfillModalOrder.country_name}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-700">{fulfillModalOrder.data_formatted}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-700">{fulfillModalOrder.duration_days} days</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm font-semibold text-gray-900">₦{fulfillModalOrder.selling_price.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Credential Fields */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            ICCID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={fulfillForm.iccid}
                            onChange={(e) => setFulfillForm({ ...fulfillForm, iccid: e.target.value })}
                            placeholder="e.g., 8944110000000000000"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            SMDP Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={fulfillForm.smdp_address}
                            onChange={(e) => setFulfillForm({ ...fulfillForm, smdp_address: e.target.value })}
                            placeholder="e.g., smdp.io"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Activation Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={fulfillForm.activation_code}
                            onChange={(e) => setFulfillForm({ ...fulfillForm, activation_code: e.target.value })}
                            placeholder="e.g., K2-1AB2C3D4-1234567"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            QR Code URL <span className="text-gray-400 font-normal text-xs">(optional - auto-generated if empty)</span>
                          </label>
                          <input
                            type="text"
                            value={fulfillForm.qr_code_url}
                            onChange={(e) => setFulfillForm({ ...fulfillForm, qr_code_url: e.target.value })}
                            placeholder="Leave empty to auto-generate from activation data"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-shadow"
                          />
                        </div>
                      </div>

                      {/* Info hint */}
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-xs text-blue-700">
                          The user will receive an email with these credentials and a QR code for installation. Make sure the information is correct before fulfilling.
                        </p>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3 px-6 pb-6">
                      <button
                        onClick={() => setFulfillModalOrder(null)}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFulfillOrder}
                        disabled={fulfilling || !fulfillForm.iccid || !fulfillForm.smdp_address || !fulfillForm.activation_code}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {fulfilling ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Fulfilling...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Fulfill Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reject Modal */}
              {rejectModalOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRejectModalOrder(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Reject Order</h3>
                          <p className="text-red-100 text-sm">This will cancel the order and refund the user</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Order Summary Card */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">{rejectModalOrder.user.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">{rejectModalOrder.user.email}</p>
                          </div>
                          <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{rejectModalOrder.order_no}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary-500" />
                            <span className="text-sm text-gray-700">{rejectModalOrder.country_name}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-700">{rejectModalOrder.data_formatted}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-700">{rejectModalOrder.duration_days} days</span>
                        </div>
                      </div>

                      {/* Refund Warning */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-900">Refund Amount</p>
                            <p className="text-xl font-bold text-amber-700">₦{rejectModalOrder.selling_price.toLocaleString()}</p>
                            <p className="text-xs text-amber-600 mt-0.5">Will be credited to the user's wallet instantly</p>
                          </div>
                        </div>
                      </div>

                      {/* Reason Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Reason for rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g., Package temporarily unavailable from provider, eSIM out of stock for this region..."
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none transition-shadow"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">This reason will be included in the email sent to the user.</p>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3 px-6 pb-6">
                      <button
                        onClick={() => setRejectModalOrder(null)}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRejectOrder}
                        disabled={rejecting || !rejectReason.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {rejecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Reject & Refund
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-8">
              {/* Fulfillment Mode */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Fulfillment Mode
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how eSIM orders are processed after purchase.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        configuration: { ...settings.configuration, fulfillment_mode: 'manual' },
                      })
                    }
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                      settings.configuration.fulfillment_mode === 'manual'
                        ? 'border-amber-500 bg-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Manual</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Orders queue for you to fulfill. Buy from Zendit dashboard, then enter credentials.
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        configuration: { ...settings.configuration, fulfillment_mode: 'auto' },
                      })
                    }
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                      settings.configuration.fulfillment_mode === 'auto'
                        ? 'border-primary-500 bg-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Automatic (Zendit API)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Purchases go through Zendit API instantly. Requires funded Zendit account.
                    </p>
                  </button>
                </div>
              </div>

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
