import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/AuthContext';
import {
  Loader2,
  TrendingUp,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  Users,
  Play,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { smmService, getErrorMessage } from '@/services';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import type { SmmCategory, SmmService, SmmOrder } from '@/types';

const categoryIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-8 h-8" />,
  tiktok: <Play className="w-8 h-8" />,
  youtube: <Youtube className="w-8 h-8" />,
  twitter: <Twitter className="w-8 h-8" />,
  facebook: <Facebook className="w-8 h-8" />,
  telegram: <MessageCircle className="w-8 h-8" />,
};

const serviceTypeIcons: Record<string, React.ReactNode> = {
  followers: <Users className="w-5 h-5" />,
  likes: <Heart className="w-5 h-5" />,
  views: <Eye className="w-5 h-5" />,
  comments: <MessageCircle className="w-5 h-5" />,
  shares: <Share2 className="w-5 h-5" />,
};

export const SmmPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'orders'>('services');
  const [categories, setCategories] = useState<SmmCategory[]>([]);
  const [services, setServices] = useState<SmmService[]>([]);
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<SmmService | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Pagination for orders
  const ordersPagination = usePagination();

  // Order form state with validation errors
  const [orderForm, setOrderForm] = useState({
    link: '',
    quantity: '',
  });

  const [formErrors, setFormErrors] = useState({
    link: '',
    quantity: '',
  });

  useEffect(() => {
    fetchCategories();
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedCategory !== null) {
      fetchServices();
    }
  }, [selectedCategory, debouncedSearch]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await smmService.getCategories();
      if (response.success) {
        setCategories(response.data);
        if (response.data.length > 0 && selectedCategory === null) {
          setSelectedCategory(response.data[0].id);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await smmService.getServices({
        category_id: selectedCategory!,
        search: debouncedSearch || undefined,
        per_page: 50,
      });
      if (response.success) {
        setServices(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await smmService.getOrders({
        page: ordersPagination.currentPage,
        per_page: 20,
      });
      if (response.success) {
        setOrders(response.data);
        if (response.meta) {
          ordersPagination.setTotalPages(response.meta.last_page);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingOrders(false);
    }
  };

  // Real-time validation
  const validateLink = (link: string): string => {
    if (!link.trim()) {
      return 'Link is required';
    }
    try {
      new URL(link);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const validateQuantity = (quantity: string, service: SmmService): string => {
    if (!quantity) {
      return 'Quantity is required';
    }
    const qty = parseInt(quantity);
    if (isNaN(qty)) {
      return 'Please enter a valid number';
    }
    if (qty < service.min_order) {
      return `Minimum order is ${service.min_order.toLocaleString()}`;
    }
    if (qty > service.max_order) {
      return `Maximum order is ${service.max_order.toLocaleString()}`;
    }
    return '';
  };

  const handleLinkChange = (link: string) => {
    setOrderForm({ ...orderForm, link });
    setFormErrors({ ...formErrors, link: validateLink(link) });
  };

  const handleQuantityChange = (quantity: string) => {
    if (!selectedService) return;
    setOrderForm({ ...orderForm, quantity });
    setFormErrors({ ...formErrors, quantity: validateQuantity(quantity, selectedService) });
  };

  const canSubmitOrder = (): boolean => {
    if (!selectedService) return false;
    if (!orderForm.link || !orderForm.quantity) return false;
    if (formErrors.link || formErrors.quantity) return false;

    const totalCost = (parseInt(orderForm.quantity) / 1000) * selectedService.price_per_1000;
    if (user && user.balance < totalCost) return false;

    return true;
  };

  const handleOrderConfirm = async () => {
    if (!selectedService) return;

    setOrdering(true);
    setShowConfirmation(false);

    try {
      const response = await smmService.createOrder({
        service_id: selectedService.id,
        link: orderForm.link,
        quantity: parseInt(orderForm.quantity),
      });

      if (response.success) {
        toast.success('Order placed successfully!');
        setSelectedService(null);
        setOrderForm({ link: '', quantity: '' });
        setFormErrors({ link: '', quantity: '' });
        setActiveTab('orders');
        fetchOrders();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setOrdering(false);
    }
  };

  const refreshOrderStatus = async (reference: string) => {
    try {
      await smmService.refreshOrderStatus(reference);
      toast.success('Status updated');
      fetchOrders();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getTotalCost = (): number => {
    if (!selectedService || !orderForm.quantity) return 0;
    return Math.ceil((parseInt(orderForm.quantity) / 1000) * selectedService.price_per_1000);
  };

  const CategorySkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-xl p-4 h-20"></div>
        </div>
      ))}
    </div>
  );

  const ServiceSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-xl p-5 h-48"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 px-1 sm:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Social Media Services</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Boost your social media presence with high-quality engagement
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
        {[
          { value: 'services', label: 'Services' },
          { value: 'orders', label: 'My Orders' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as any)}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-md text-sm font-medium transition-all min-h-[44px] ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-5">
          {/* Categories */}
          {loadingCategories ? (
            <CategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                const icon = categoryIcons[category.slug.toLowerCase()] || <TrendingUp className="w-8 h-8" />;

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('');
                    }}
                    className={`p-5 rounded-xl border-2 transition-all min-h-[88px] flex flex-col items-center justify-center gap-2 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {icon}
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search services..."
            loading={loadingServices}
          />

          {/* Services Grid */}
          {loadingServices ? (
            <ServiceSkeleton />
          ) : services.length === 0 ? (
            <div className="card !p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No services found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const typeIcon = serviceTypeIcons[service.type.toLowerCase()] || null;

                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setOrderForm({ link: '', quantity: '' });
                      setFormErrors({ link: '', quantity: '' });
                    }}
                    className="card !p-5 text-left hover:shadow-lg hover:border-primary-200 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {typeIcon && (
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          {typeIcon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                          {service.name}
                        </h3>
                        <p className="text-xs text-gray-500">{service.category.name}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-primary-600">
                        ₦{service.price_per_1000.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">/1000</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>Min: {service.min_order.toLocaleString()}</span>
                      <span>Max: {service.max_order.toLocaleString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {service.refill_enabled && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-medium rounded-full">
                          Refillable
                        </span>
                      )}
                      {service.cancel_enabled && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                          Cancellable
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="card !p-5 sm:!p-6">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No orders yet</p>
                <p className="text-xs text-gray-400 mt-1">Place your first order to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 rounded-xl border border-gray-150 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">{order.service.name}</h3>
                        <p className="text-xs text-gray-500">{order.service.category}</p>
                      </div>
                      <StatusBadge status={order.status} size="md" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <ExternalLink className="w-4 h-4" />
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-primary-600"
                        >
                          {order.link}
                        </a>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Quantity</span>
                          <p className="font-semibold text-gray-900">{order.quantity.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount</span>
                          <p className="font-semibold text-gray-900">₦{order.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Progress</span>
                          <p className="font-semibold text-gray-900">{order.progress}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Remains</span>
                          <p className="font-semibold text-gray-900">{order.remains?.toLocaleString() || '-'}</p>
                        </div>
                      </div>

                      {order.status === 'in_progress' && (
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {(order.status === 'processing' || order.status === 'in_progress') && (
                          <button
                            onClick={() => refreshOrderStatus(order.reference)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 min-h-[44px] px-3 -mx-3"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M23 4v6h-6M1 20v-6h6" />
                              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                            </svg>
                            Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {ordersPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={ordersPagination.prevPage}
                disabled={!ordersPagination.hasPrevPage}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-6"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {ordersPagination.currentPage} of {ordersPagination.totalPages}
              </span>
              <button
                onClick={ordersPagination.nextPage}
                disabled={!ordersPagination.hasNextPage}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-6"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-5 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="text-xl font-bold">{selectedService.name}</h2>
              <p className="text-sm text-primary-100 mt-1">{selectedService.category.name}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Pricing */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-600">
                  ₦{selectedService.price_per_1000.toLocaleString()}
                </span>
                <span className="text-base text-gray-500">per 1000</span>
              </div>

              {/* Description */}
              {selectedService.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{selectedService.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Min Order</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedService.min_order.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium">Max Order</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedService.max_order.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Link Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Social Media Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={orderForm.link}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[48px] ${
                    formErrors.link ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.link && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.link}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder={`Min: ${selectedService.min_order.toLocaleString()}`}
                  min={selectedService.min_order}
                  max={selectedService.max_order}
                  className={`w-full px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[48px] ${
                    formErrors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.quantity && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.quantity}
                  </div>
                )}
              </div>

              {/* Total Cost */}
              {orderForm.quantity && !formErrors.quantity && (
                <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Total Cost</span>
                    <span className="text-3xl font-bold text-primary-600">
                      ₦{getTotalCost().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-primary-200">
                    <span className="text-xs text-gray-600">Your Balance</span>
                    <span className="text-base font-semibold text-gray-900">₦{user?.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-200">
                    <span className="text-xs text-gray-600">After Purchase</span>
                    <span className={`text-base font-semibold ${(user?.balance || 0) - getTotalCost() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₦{((user?.balance || 0) - getTotalCost()).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Insufficient Balance Warning */}
              {orderForm.quantity && !formErrors.quantity && user && user.balance < getTotalCost() && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Insufficient Balance</p>
                    <p className="text-xs text-red-600 mt-1">
                      You need ₦{(getTotalCost() - user.balance).toLocaleString()} more to place this order.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors min-h-[52px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!canSubmitOrder() || ordering}
                  className="flex-1 btn-primary !py-4 min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ordering ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleOrderConfirm}
        title="Confirm Order"
        message={`You are about to place an order for ${orderForm.quantity} ${selectedService?.type || 'items'} for ₦${getTotalCost().toLocaleString()}. Do you want to proceed?`}
        confirmText="Yes, Place Order"
        cancelText="Cancel"
        variant="info"
        loading={ordering}
      />
    </div>
  );
};
