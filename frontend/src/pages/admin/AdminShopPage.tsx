import { useState, useEffect } from 'react';
import {
  Shield, Package, ShoppingCart, DollarSign, Clock, CheckCircle, XCircle,
  Plus, Edit2, Eye, ChevronLeft, ChevronRight, BarChart3, Search, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminShopService } from '@/services/admin-shop.service';
import { usePagination } from '@/hooks/usePagination';
import type { ShopProduct, ShopOrder } from '@/types/shop';
import type { ShopDashboardStats } from '@/services/admin-shop.service';
import { getShopStatusColor, getShopStatusLabel } from '@/types/shop';

type AdminTab = 'dashboard' | 'orders' | 'products';

export function AdminShopPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Dashboard
  const [stats, setStats] = useState<ShopDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Orders
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const orderPagination = usePagination();

  // Fulfill modal
  const [fulfillOrder, setFulfillOrder] = useState<ShopOrder | null>(null);
  const [fulfillForm, setFulfillForm] = useState({ activation_code: '', activation_instructions: '', admin_notes: '' });
  const [fulfilling, setFulfilling] = useState(false);

  // Cancel modal
  const [cancelOrder, setCancelOrder] = useState<ShopOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Products
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', category: 'vpn', duration_days: 30,
    duration_label: '1 Month', wholesale_cost: 0, selling_price: 0,
    is_active: true, sort_order: 0,
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Stock modal
  const [stockProduct, setStockProduct] = useState<ShopProduct | null>(null);
  const [stockCodes, setStockCodes] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [orderPagination.currentPage, orderStatusFilter]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await adminShopService.getDashboard();
      if (response.success) setStats(response.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await adminShopService.getOrders({
        page: orderPagination.currentPage,
        status: orderStatusFilter || undefined,
        search: orderSearch || undefined,
      });
      if (response.success) {
        setOrders(response.data);
        if (response.meta) {
          orderPagination.setTotalPages(response.meta.last_page);
        }
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await adminShopService.getProducts();
      if (response.success) setProducts(response.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFulfill = async () => {
    if (!fulfillOrder || !fulfillForm.activation_code.trim()) return;

    setFulfilling(true);
    try {
      const response = await adminShopService.fulfillOrder(fulfillOrder.id, {
        activation_code: fulfillForm.activation_code.trim(),
        activation_instructions: fulfillForm.activation_instructions.trim() || undefined,
        admin_notes: fulfillForm.admin_notes.trim() || undefined,
      });
      if (response.success) {
        toast.success('Order fulfilled successfully');
        setFulfillOrder(null);
        setFulfillForm({ activation_code: '', activation_instructions: '', admin_notes: '' });
        fetchOrders();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to fulfill order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fulfill order');
    } finally {
      setFulfilling(false);
    }
  };

  const handleFulfillFromStock = async (order: ShopOrder) => {
    try {
      const response = await adminShopService.fulfillFromStock(order.id);
      if (response.success) {
        toast.success('Order fulfilled from stock');
        fetchOrders();
        fetchStats();
        fetchProducts();
      } else {
        toast.error(response.message || 'Failed to fulfill from stock');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No stock available');
    }
  };

  const handleCancel = async () => {
    if (!cancelOrder) return;

    setCancelling(true);
    try {
      const response = await adminShopService.cancelOrder(cancelOrder.id, cancelReason.trim() || undefined);
      if (response.success) {
        toast.success('Order cancelled and refunded');
        setCancelOrder(null);
        setCancelReason('');
        fetchOrders();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProduct = async () => {
    setSavingProduct(true);
    try {
      if (editingProduct) {
        const response = await adminShopService.updateProduct(editingProduct.id, productForm);
        if (response.success) {
          toast.success('Product updated');
          resetProductForm();
          fetchProducts();
        }
      } else {
        const response = await adminShopService.createProduct(productForm);
        if (response.success) {
          toast.success('Product created');
          resetProductForm();
          fetchProducts();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleAddStock = async () => {
    if (!stockProduct || !stockCodes.trim()) return;

    setAddingStock(true);
    try {
      const codes = stockCodes.split('\n').map(c => c.trim()).filter(Boolean);
      if (codes.length === 0) {
        toast.error('Please enter at least one code');
        return;
      }
      const response = await adminShopService.addStock(stockProduct.id, codes);
      if (response.success) {
        toast.success(`${response.data.added} codes added`);
        setStockProduct(null);
        setStockCodes('');
        fetchProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const resetProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({
      name: '', description: '', category: 'vpn', duration_days: 30,
      duration_label: '1 Month', wholesale_cost: 0, selling_price: 0,
      is_active: true, sort_order: 0,
    });
  };

  const startEditProduct = (product: ShopProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      duration_days: product.duration_days,
      duration_label: product.duration_label,
      wholesale_cost: Number(product.wholesale_cost) || 0,
      selling_price: Number(product.selling_price),
      is_active: product.is_active,
      sort_order: product.sort_order,
    });
    setShowProductForm(true);
  };

  const formatPrice = (price: number) => `₦${Number(price).toLocaleString()}`;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-7 h-7 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">Manage VPN products, orders, and fulfillment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {loadingStats ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Total Orders" value={stats.total_orders} color="blue" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending_orders} color="yellow" />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Fulfilled" value={stats.fulfilled_orders} color="green" />
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={formatPrice(stats.total_revenue)} color="emerald" />
              </div>

              {stats.recent_orders.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {stats.recent_orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.product?.name}</p>
                          <p className="text-xs text-gray-500">{order.user?.name} - {order.reference}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getShopStatusColor(order.status)}`}>
                            {getShopStatusLabel(order.status)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatPrice(order.amount_paid)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference or user..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                orderPagination.resetToFirstPage();
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{order.user?.name}</p>
                            <p className="text-xs text-gray-500">{order.user?.email}</p>
                          </td>
                          <td className="px-4 py-3">{order.product?.name}</td>
                          <td className="px-4 py-3 font-medium">{formatPrice(order.amount_paid)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getShopStatusColor(order.status)}`}>
                              {getShopStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {order.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setFulfillOrder(order)}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  Fulfill
                                </button>
                                <button
                                  onClick={() => handleFulfillFromStock(order)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  title="Fulfill from stock"
                                >
                                  Stock
                                </button>
                                <button
                                  onClick={() => setCancelOrder(order)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {orderPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => orderPagination.goToPage(orderPagination.currentPage - 1)}
                    disabled={orderPagination.currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {orderPagination.currentPage} of {orderPagination.totalPages}
                  </span>
                  <button
                    onClick={() => orderPagination.goToPage(orderPagination.currentPage + 1)}
                    disabled={orderPagination.currentPage >= orderPagination.totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Products</h3>
            <button
              onClick={() => {
                resetProductForm();
                setShowProductForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        {!product.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-500">Cost: <span className="font-medium text-gray-900">{formatPrice(Number(product.wholesale_cost) || 0)}</span></span>
                        <span className="text-gray-500">Price: <span className="font-medium text-green-600">{formatPrice(product.selling_price)}</span></span>
                        <span className="text-gray-500">Duration: <span className="font-medium text-gray-900">{product.duration_label}</span></span>
                        <span className="text-gray-500">Stock: <span className="font-medium text-gray-900">{product.stock_count} ({product.available_stock_count ?? 0} codes)</span></span>
                        <span className="text-gray-500">Orders: <span className="font-medium text-gray-900">{product.total_orders_count ?? 0} ({product.pending_orders_count ?? 0} pending)</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStockProduct(product)}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Add Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fulfill Order Modal */}
      {fulfillOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Fulfill Order</h3>
            <p className="text-sm text-gray-500 mb-4">
              {fulfillOrder.reference} — {fulfillOrder.product?.name} — {fulfillOrder.user?.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activation Code *</label>
                <textarea
                  value={fulfillForm.activation_code}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, activation_code: e.target.value })}
                  placeholder="Paste the activation code here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activation Instructions</label>
                <textarea
                  value={fulfillForm.activation_instructions}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, activation_instructions: e.target.value })}
                  placeholder="Optional instructions for the user..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={fulfillForm.admin_notes}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, admin_notes: e.target.value })}
                  placeholder="Internal notes (not shown to user)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setFulfillOrder(null);
                  setFulfillForm({ activation_code: '', activation_instructions: '', admin_notes: '' });
                }}
                className="flex-1 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFulfill}
                disabled={fulfilling || !fulfillForm.activation_code.trim()}
                className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {fulfilling ? 'Fulfilling...' : 'Fulfill Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-4">
              {cancelOrder.reference} — {formatPrice(cancelOrder.amount_paid)} will be refunded to {cancelOrder.user?.name}'s wallet.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is this order being cancelled?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelOrder(null);
                  setCancelReason('');
                }}
                className="flex-1 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration Label</label>
                  <input
                    type="text"
                    value={productForm.duration_label}
                    onChange={(e) => setProductForm({ ...productForm, duration_label: e.target.value })}
                    placeholder="e.g. 1 Year"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={productForm.duration_days}
                    onChange={(e) => setProductForm({ ...productForm, duration_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(e) => setProductForm({ ...productForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Cost (₦)</label>
                  <input
                    type="number"
                    value={productForm.wholesale_cost}
                    onChange={(e) => setProductForm({ ...productForm, wholesale_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    value={productForm.selling_price}
                    onChange={(e) => setProductForm({ ...productForm, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible to users)</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetProductForm}
                className="flex-1 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={savingProduct || !productForm.name.trim()}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {stockProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add Stock Codes</h3>
            <p className="text-sm text-gray-500 mb-4">
              {stockProduct.name} — Current stock: {stockProduct.stock_count}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activation Codes (one per line)</label>
              <textarea
                value={stockCodes}
                onChange={(e) => setStockCodes(e.target.value)}
                placeholder="Paste activation codes here, one per line..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                {stockCodes.split('\n').filter(c => c.trim()).length} codes entered
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStockProduct(null);
                  setStockCodes('');
                }}
                className="flex-1 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStock}
                disabled={addingStock || !stockCodes.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {addingStock ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color] || colorClasses.blue}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
