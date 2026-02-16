import { useState, useEffect } from 'react';
import { Shield, ShoppingCart, Package, Clock, CheckCircle, XCircle, Copy, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { shopService } from '@/services/shopService';
import { useAuth } from '@/stores/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import type { ShopProduct, ShopOrder, ShopOrderStatus } from '@/types/shop';
import { getShopStatusColor, getShopStatusLabel } from '@/types/shop';

export function ShopPage() {
  const { user, refreshUser } = useAuth();
  const [activeView, setActiveView] = useState<'products' | 'orders'>('products');

  // Products state
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const orderPagination = usePagination();

  // Purchase state
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Order detail state
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeView === 'orders') {
      fetchOrders();
    }
  }, [activeView, orderPagination.currentPage]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await shopService.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await shopService.getOrders(orderPagination.currentPage);
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

  const handlePurchase = async () => {
    if (!selectedProduct || !user) return;

    setPurchasing(true);
    try {
      const response = await shopService.purchase(selectedProduct.id);
      if (response.success) {
        toast.success(response.message || 'Order placed successfully!');
        setShowConfirmModal(false);
        setSelectedProduct(null);
        refreshUser();
        setActiveView('orders');
        fetchOrders();
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPurchasing(false);
    }
  };

  const handleViewOrder = async (order: ShopOrder) => {
    try {
      const response = await shopService.getOrder(order.id);
      if (response.success) {
        setSelectedOrder(response.data);
        setShowOrderDetail(true);
      }
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatPrice = (price: number) => {
    return `₦${Number(price).toLocaleString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--color-success-100)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--color-success-600)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>VPN Shop</h1>
            <p className="text-sm text-gray-500">Purchase premium VPN subscriptions</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'products'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Plans
        </button>
        <button
          onClick={() => setActiveView('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'orders'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          My Orders
        </button>
      </div>

      {/* Products View */}
      {activeView === 'products' && (
        <div>
          {loadingProducts ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products available at the moment</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
                    product.sort_order === 1 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  {product.sort_order === 1 && (
                    <div className="bg-emerald-600 text-white text-center py-1.5 text-xs font-semibold uppercase tracking-wider">
                      Best Value
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{product.duration_label}</span>
                    </div>

                    <div className="mb-5">
                      <span className="text-3xl font-bold text-gray-900">{formatPrice(product.selling_price)}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowConfirmModal(true);
                      }}
                      className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders View */}
      {activeView === 'orders' && (
        <div>
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No orders yet</p>
              <button
                onClick={() => setActiveView('products')}
                className="text-emerald-600 text-sm font-medium hover:underline"
              >
                Browse VPN Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.product?.name}</h3>
                      <p className="text-sm text-gray-500">{order.reference}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getShopStatusColor(order.status)}`}>
                      {getShopStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>{formatPrice(order.amount_paid)}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>

                  {order.status === 'fulfilled' && order.activation_code && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-700 mb-1">Activation Code</p>
                          <p className="text-sm font-mono text-green-900 break-all">{order.activation_code}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(order.activation_code!)}
                          className="ml-3 p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {order.activation_instructions && (
                        <p className="text-xs text-green-700 mt-2 border-t border-green-200 pt-2">
                          {order.activation_instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {order.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700">Your activation code is being prepared. You'll be notified once it's ready.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleViewOrder(order)}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}

              {/* Pagination */}
              {orderPagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => orderPagination.goToPage(orderPagination.currentPage - 1)}
                    disabled={orderPagination.currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {orderPagination.currentPage} of {orderPagination.totalPages}
                  </span>
                  <button
                    onClick={() => orderPagination.goToPage(orderPagination.currentPage + 1)}
                    disabled={orderPagination.currentPage >= orderPagination.totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Purchase</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">{selectedProduct.name}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{selectedProduct.duration_label}</p>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Price</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(selectedProduct.selling_price)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-5 px-1">
              <span className="text-gray-500">Your Balance</span>
              <span className={`font-semibold ${user && user.balance >= Number(selectedProduct.selling_price) ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(user?.balance || 0)}
              </span>
            </div>

            {user && user.balance < Number(selectedProduct.selling_price) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">Insufficient balance. Please fund your wallet first.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-2.5 px-4 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || !user || user.balance < Number(selectedProduct.selling_price)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <button
                onClick={() => {
                  setShowOrderDetail(false);
                  setSelectedOrder(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Reference</span>
                    <p className="font-medium text-gray-900">{selectedOrder.reference}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status</span>
                    <p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getShopStatusColor(selectedOrder.status)}`}>
                        {getShopStatusLabel(selectedOrder.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Product</span>
                    <p className="font-medium text-gray-900">{selectedOrder.product?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount</span>
                    <p className="font-medium text-gray-900">{formatPrice(selectedOrder.amount_paid)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedOrder.fulfilled_at && (
                    <div>
                      <span className="text-gray-500">Fulfilled</span>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedOrder.fulfilled_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.status === 'fulfilled' && selectedOrder.activation_code && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-700">Activation Code</span>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.activation_code!)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <p className="text-sm font-mono text-green-900 break-all bg-white rounded-lg p-3 border border-green-200">
                    {selectedOrder.activation_code}
                  </p>
                  {selectedOrder.activation_instructions && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <span className="text-xs font-medium text-green-700">Instructions</span>
                      <p className="text-sm text-green-800 mt-1">{selectedOrder.activation_instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">Your activation code is being prepared. You'll receive an email once it's ready.</p>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700">This order was cancelled. A refund has been issued to your wallet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
