import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  RefreshCw,
  DollarSign,
  Settings,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  Search,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { adminSmmService, getErrorMessage } from '@/services';
import {
  SmmCategory,
  SmmOrderStatus,
  getSmmStatusColor,
  getSmmStatusLabel,
} from '@/types/smm';

interface SmmDashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  failed_orders: number;
  total_revenue: number;
  today_revenue: number;
  active_services: number;
  total_services: number;
  recent_orders: Array<{
    id: number;
    reference: string;
    user: {
      name: string;
      email: string;
    };
    service: {
      name: string;
      category: string;
    };
    quantity: number;
    amount: number;
    status: string;
    created_at: string;
  }>;
}

interface SmmServiceDetailed {
  id: number;
  category: {
    id: number;
    name: string;
  };
  name: string;
  description?: string;
  type: string;
  provider: string;
  provider_service_id: string;
  cost_per_1000: number;
  price_per_1000: number;
  min_order: number;
  max_order: number;
  refill_enabled: boolean;
  cancel_enabled: boolean;
  is_active: boolean;
  sales_count?: number;
}

interface SmmOrderDetailed {
  id: number;
  reference: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  service: {
    name: string;
    category: string;
  };
  link: string;
  quantity: number;
  amount: number;
  status: SmmOrderStatus;
  progress: number;
  start_count?: number;
  remains?: number;
  provider_order_id?: string;
  created_at: string;
  completed_at?: string;
}

interface ProviderBalance {
  provider: string;
  balance: number;
  currency: string;
  status: string;
}

export function AdminSMMPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'orders' | 'settings'>('dashboard');
  const [stats, setStats] = useState<SmmDashboardStats | null>(null);
  const [services, setServices] = useState<SmmServiceDetailed[]>([]);
  const [orders, setOrders] = useState<SmmOrderDetailed[]>([]);
  const [categories, setCategories] = useState<SmmCategory[]>([]);
  const [providerBalances, setProviderBalances] = useState<ProviderBalance[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [serviceFilters, setServiceFilters] = useState({
    category_id: undefined as number | undefined,
    provider: undefined as string | undefined,
    is_active: undefined as boolean | undefined,
    search: '',
  });

  const [orderFilters, setOrderFilters] = useState({
    status: undefined as string | undefined,
    search: '',
    from_date: undefined as string | undefined,
    to_date: undefined as string | undefined,
  });

  // Edit modal
  const [editingService, setEditingService] = useState<SmmServiceDetailed | null>(null);
  const [editForm, setEditForm] = useState({
    price_per_1000: 0,
    min_order: 0,
    max_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      fetchProviderBalances();
    } else if (activeTab === 'services') {
      fetchServices();
      fetchCategories();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (activeTab === 'services') {
      setCurrentPage(1);
      fetchServices();
    }
  }, [serviceFilters]);

  useEffect(() => {
    if (activeTab === 'orders') {
      setCurrentPage(1);
      fetchOrders();
    }
  }, [orderFilters]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await adminSmmService.getDashboard();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await adminSmmService.getServices({
        page: currentPage,
        per_page: 20,
        ...serviceFilters,
      });
      if (response.success) {
        setServices(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminSmmService.getOrders({
        page: currentPage,
        per_page: 20,
        ...orderFilters,
      });
      if (response.success) {
        setOrders(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminSmmService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProviderBalances = async () => {
    try {
      const response = await adminSmmService.checkBalances();
      if (response.success && Array.isArray(response.data)) {
        setProviderBalances(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch provider balances:', error);
      setProviderBalances([]);
    }
  };

  const handleSyncServices = async () => {
    setSyncing(true);
    toast.info('Syncing SMM services from providers...');
    try {
      const response = await adminSmmService.syncServices();
      if (response.success) {
        // Process provider results
        const results = response.data;
        let totalSynced = 0;
        let messages: string[] = [];

        // Handle warning case (no providers enabled)
        if (results.warning) {
          toast.warning(results.message || 'No providers enabled');
          return;
        }

        // Process each provider's result
        Object.keys(results).forEach((provider) => {
          const result = results[provider];
          if (result.success) {
            totalSynced += result.synced || 0;
            const msg = `${provider.toUpperCase()}: Retrieved ${result.retrieved || 0}, synced ${result.synced || 0}, failed ${result.failed || 0}`;
            messages.push(msg);

            // Add error samples if any
            if (result.errors && result.errors.length > 0) {
              messages.push(`  Sample errors: ${result.errors.join('; ')}`);
            }
          } else {
            messages.push(`${provider.toUpperCase()}: ${result.message}`);
          }
        });

        if (totalSynced > 0) {
          toast.success(`Synced ${totalSynced} services!\n${messages.join('\n')}`);
        } else if (messages.length > 0) {
          toast.warning(`Sync completed but no services saved:\n${messages.join('\n')}`);
        } else {
          toast.info('Sync completed');
        }

        await fetchDashboard();
        if (activeTab === 'services') {
          await fetchServices();
        }
      } else {
        toast.error(response.message || 'Sync failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSyncing(false);
    }
  };

  const handleEditService = (service: SmmServiceDetailed) => {
    setEditingService(service);
    setEditForm({
      price_per_1000: service.price_per_1000,
      min_order: service.min_order,
      max_order: service.max_order,
      is_active: service.is_active,
    });
  };

  const handleSaveService = async () => {
    if (!editingService) return;

    setSaving(true);
    try {
      const response = await adminSmmService.updateService(editingService.id, editForm);
      if (response.success) {
        toast.success('Service updated successfully');
        setEditingService(null);
        await fetchServices();
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshOrderStatus = async (orderId: number) => {
    try {
      const response = await adminSmmService.updateOrderStatus(orderId);
      if (response.success) {
        toast.success('Order status updated');
        await fetchOrders();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const calculateMarkup = (cost: number, price: number): number => {
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  const getMarkupColor = (markup: number): string => {
    if (markup >= 30) return 'text-green-600';
    if (markup >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMM Panel Management</h1>
          <p className="text-gray-500 mt-1">Manage social media marketing services and orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
            { id: 'services', name: 'Services', icon: ShoppingCart },
            { id: 'orders', name: 'Orders', icon: ShoppingCart },
            { id: 'settings', name: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Sync Services Button */}
          <div className="card bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Sync Services from Provider</h3>
                <p className="text-purple-100 text-sm">Import the latest services from JustAnotherPanel</p>
              </div>
              <button
                onClick={handleSyncServices}
                disabled={syncing}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Orders</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats?.total_orders || 0}
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-blue-100" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pending Orders</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats?.pending_orders || 0}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-yellow-100" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completed Orders</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats?.completed_orders || 0}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-100" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : `₦${stats?.total_revenue.toLocaleString() || 0}`}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-100" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Today's Revenue</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : `₦${stats?.today_revenue.toLocaleString() || 0}`}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-100" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100">Active Services</p>
                  <p className="text-3xl font-bold mt-1">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : `${stats?.active_services || 0} / ${stats?.total_services || 0}`}
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-teal-100" />
              </div>
            </div>
          </div>

          {/* Provider Status */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Provider Status</h2>
            <div className="space-y-4">
              {!Array.isArray(providerBalances) || providerBalances.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No provider information available</p>
                </div>
              ) : (
                providerBalances.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {provider.status === 'connected' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{provider.provider.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">
                          Balance: {provider.currency} {provider.balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      provider.status === 'connected'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {provider.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reference</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Service</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </td>
                    </tr>
                  ) : (stats?.recent_orders || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No recent orders
                      </td>
                    </tr>
                  ) : (
                    (stats?.recent_orders || []).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono">{order.reference}</td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-gray-500 text-xs">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium">{order.service.name}</p>
                            <p className="text-gray-500 text-xs">{order.service.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">₦{order.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSmmStatusColor(order.status as SmmOrderStatus)}`}>
                            {getStatusIcon(order.status)}
                            {getSmmStatusLabel(order.status as SmmOrderStatus)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input-field"
                  value={serviceFilters.category_id || ''}
                  onChange={(e) => setServiceFilters({ ...serviceFilters, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input-field"
                  value={serviceFilters.is_active === undefined ? '' : String(serviceFilters.is_active)}
                  onChange={(e) => setServiceFilters({ ...serviceFilters, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
                >
                  <option value="">All</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Search services..."
                    value={serviceFilters.search}
                    onChange={(e) => setServiceFilters({ ...serviceFilters, search: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cost/1000</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price/1000</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Markup</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Min/Max</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sales</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => {
                      const markup = calculateMarkup(service.cost_per_1000, service.price_per_1000);
                      return (
                        <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-sm">{service.name}</p>
                              <p className="text-xs text-gray-500">{service.category.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm capitalize">{service.type}</td>
                          <td className="py-3 px-4 text-sm">₦{service.cost_per_1000.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm font-medium">₦{service.price_per_1000.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-medium ${getMarkupColor(markup)}`}>
                              {markup.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {service.min_order.toLocaleString()} - {service.max_order.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm">{service.sales_count || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input-field"
                  value={orderFilters.status || ''}
                  onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value || undefined })}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Search orders by reference or user..."
                    value={orderFilters.search}
                    onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono">{order.reference}</td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-gray-500 text-xs">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium">{order.service.name}</p>
                            <p className="text-gray-500 text-xs">{order.service.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{order.quantity.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm font-medium">₦{order.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSmmStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getSmmStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.status === 'in_progress' && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${order.progress}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRefreshOrderStatus(order.id)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Refresh status"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Provider Configuration</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure SMM provider settings and test connections. Settings are managed in your .env file.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  SMM provider settings (API keys, base URLs) must be configured in your backend .env file.
                  Use the sync button on the Dashboard tab to sync services from providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-semibold">Edit Service</h2>
              <p className="text-sm text-primary-100 mt-1">{editingService.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per 1000 (₦)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={editForm.price_per_1000}
                  onChange={(e) => setEditForm({ ...editForm, price_per_1000: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cost: ₦{editingService.cost_per_1000} | Markup: {calculateMarkup(editingService.cost_per_1000, editForm.price_per_1000).toFixed(1)}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.min_order}
                    onChange={(e) => setEditForm({ ...editForm, min_order: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.max_order}
                    onChange={(e) => setEditForm({ ...editForm, max_order: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Service Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingService(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveService}
                  disabled={saving}
                  className="flex-1 btn-primary"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
