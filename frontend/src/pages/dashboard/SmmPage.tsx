import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  TrendingUp,
  ShoppingCart,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { smmService, getErrorMessage } from '@/services';
import type { SmmCategory, SmmService, SmmOrder } from '@/types/smm';
import { getSmmStatusColor, getSmmStatusLabel } from '@/types/smm';
import { ServiceIcon } from '@/components/icons';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { SearchInput } from '@/components/common/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';

export function SmmPage() {
  const [activeView, setActiveView] = useState<'services' | 'orders'>('services');

  // Services state
  const [categories, setCategories] = useState<SmmCategory[]>([]);
  const [services, setServices] = useState<SmmService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<SmmService | null>(null);

  // Orders state
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Order form state
  const [orderForm, setOrderForm] = useState({
    link: '',
    quantity: '',
  });
  const [formErrors, setFormErrors] = useState({
    link: '',
    quantity: '',
  });

  // UI state
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { currentPage, setTotalPages, nextPage, prevPage, hasNextPage, hasPrevPage } = usePagination();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeView === 'services') {
      fetchServices();
    } else {
      fetchOrders();
    }
  }, [activeView, selectedCategory, debouncedSearch, currentPage, orderFilter]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await smmService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await smmService.getServices({
        category_id: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        per_page: 12,
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
      setLoadingServices(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await smmService.getOrders({
        status: orderFilter === 'all' ? undefined : orderFilter,
        per_page: 10,
        page: currentPage,
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
      setLoadingOrders(false);
    }
  };

  const handleServiceClick = (service: SmmService) => {
    setSelectedService(service);
    setShowOrderModal(true);
    setOrderForm({ link: '', quantity: '' });
    setFormErrors({ link: '', quantity: '' });
  };

  const validateForm = (): boolean => {
    const errors = { link: '', quantity: '' };
    let isValid = true;

    // Validate link
    if (!orderForm.link.trim()) {
      errors.link = 'Link is required';
      isValid = false;
    } else {
      try {
        new URL(orderForm.link);
      } catch {
        errors.link = 'Please enter a valid URL';
        isValid = false;
      }
    }

    // Validate quantity
    if (!orderForm.quantity) {
      errors.quantity = 'Quantity is required';
      isValid = false;
    } else {
      const qty = parseInt(orderForm.quantity);
      if (isNaN(qty)) {
        errors.quantity = 'Please enter a valid number';
        isValid = false;
      } else if (selectedService) {
        if (qty < selectedService.min_order) {
          errors.quantity = `Minimum order is ${selectedService.min_order.toLocaleString()}`;
          isValid = false;
        } else if (qty > selectedService.max_order) {
          errors.quantity = `Maximum order is ${selectedService.max_order.toLocaleString()}`;
          isValid = false;
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const calculateCost = (): number => {
    if (!selectedService || !orderForm.quantity) return 0;
    const qty = parseInt(orderForm.quantity);
    if (isNaN(qty)) return 0;
    return (qty / 1000) * selectedService.price_per_1000;
  };

  const handleSubmitOrder = () => {
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const confirmOrder = async () => {
    if (!selectedService) return;

    setSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const response = await smmService.createOrder({
        service_id: selectedService.id,
        link: orderForm.link,
        quantity: parseInt(orderForm.quantity),
      });

      if (response.success) {
        toast.success(`Order ${response.data.reference} created successfully!`);
        setShowOrderModal(false);
        setSelectedService(null);
        setOrderForm({ link: '', quantity: '' });
        if (activeView === 'orders') {
          fetchOrders();
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshOrder = async (reference: string) => {
    try {
      const response = await smmService.refreshOrderStatus(reference);
      if (response.success) {
        toast.success('Order status refreshed');
        fetchOrders();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getServiceIcon = (serviceName: string) => {
    // Extract platform name from service name
    const name = serviceName.toLowerCase();
    if (name.includes('instagram')) return 'instagram';
    if (name.includes('facebook')) return 'facebook';
    if (name.includes('twitter') || name.includes('x ')) return 'twitter';
    if (name.includes('youtube')) return 'youtube';
    if (name.includes('tiktok')) return 'tiktok';
    if (name.includes('telegram')) return 'telegram';
    if (name.includes('whatsapp')) return 'whatsapp';
    if (name.includes('linkedin')) return 'linkedin';
    if (name.includes('pinterest')) return 'pinterest';
    if (name.includes('snapchat')) return 'snapchat';
    if (name.includes('reddit')) return 'reddit';
    if (name.includes('discord')) return 'discord';
    if (name.includes('twitch')) return 'twitch';
    if (name.includes('spotify')) return 'spotify';
    return 'general';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMM Services</h1>
            <p className="text-gray-600">Boost your social media presence with high-quality engagement</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveView('services')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            activeView === 'services'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Browse Services
          </span>
        </button>
        <button
          onClick={() => setActiveView('orders')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            activeView === 'orders'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Orders
          </span>
        </button>
      </div>

      {/* Services View */}
      {activeView === 'services' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search services..."
                loading={loadingServices}
              />
            </div>
          </div>

          {/* Categories */}
          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  selectedCategory === null
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Filter className="w-8 h-8 text-purple-600" />
                  <span className="font-medium text-sm">All Services</span>
                  <span className="text-xs text-gray-500">
                    {categories.reduce((sum, cat) => sum + cat.services_count, 0)} services
                  </span>
                </div>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedCategory === category.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ServiceIcon service={category.name} size={32} />
                    <span className="font-medium text-sm line-clamp-2">{category.name}</span>
                    <span className="text-xs text-gray-500">{category.services_count} services</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Services Grid */}
          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl h-48"></div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="p-6">
                    {/* Service Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <ServiceIcon service={getServiceIcon(service.name)} size={48} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500">{service.category.name}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Service Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price per 1K</span>
                        <span className="font-bold text-purple-600">
                          ₦{service.price_per_1000.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min / Max</span>
                        <span className="font-medium text-gray-900">
                          {service.min_order.toLocaleString()} - {service.max_order.toLocaleString()}
                        </span>
                      </div>
                      {service.average_time_minutes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg. Time</span>
                          <span className="font-medium text-gray-900">
                            {service.average_time_minutes} min
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.refill_enabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <RefreshCw className="w-3 h-3" />
                          Refill
                        </span>
                      )}
                      {service.cancel_enabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          Cancelable
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                      Order Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
        <div className="space-y-6">
          {/* Order Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'processing', 'in_progress', 'completed', 'failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setOrderFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  orderFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'All Orders' : filter.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-200">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start by browsing our services</p>
              <button
                onClick={() => setActiveView('services')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <ServiceIcon service={getServiceIcon(order.service.name)} size={40} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{order.service.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              getSmmStatusColor(order.status)
                            }`}>
                              {getSmmStatusLabel(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            Order #{order.reference} • {order.service.category}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <span className="ml-2 font-medium">{order.quantity.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <span className="ml-2 font-bold text-purple-600">₦{order.amount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Progress:</span>
                              <span className="ml-2 font-medium">{order.progress}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <span className="ml-2 font-medium">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${order.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleRefreshOrder(order.reference)}
                          className="p-2 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                          title="Refresh status"
                        >
                          <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {orders.length > 0 && (hasPrevPage || hasNextPage) && (
            <div className="flex justify-center gap-2">
              <button
                onClick={prevPage}
                disabled={!hasPrevPage}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center gap-4 mb-2">
                <ServiceIcon service={getServiceIcon(selectedService.name)} size={48} colored={false} className="text-white" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedService.name}</h2>
                  <p className="text-purple-100 text-sm">{selectedService.category.name}</p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Service Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per 1,000</span>
                  <span className="font-bold text-purple-600">₦{selectedService.price_per_1000.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min / Max Order</span>
                  <span className="font-medium">{selectedService.min_order.toLocaleString()} - {selectedService.max_order.toLocaleString()}</span>
                </div>
                {selectedService.average_time_minutes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Time</span>
                    <span className="font-medium">{selectedService.average_time_minutes} minutes</span>
                  </div>
                )}
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link / URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={orderForm.link}
                    onChange={(e) => {
                      setOrderForm({ ...orderForm, link: e.target.value });
                      setFormErrors({ ...formErrors, link: '' });
                    }}
                    placeholder="https://instagram.com/username"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.link ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.link && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.link}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={orderForm.quantity}
                    onChange={(e) => {
                      setOrderForm({ ...orderForm, quantity: e.target.value });
                      setFormErrors({ ...formErrors, quantity: '' });
                    }}
                    placeholder={`Min: ${selectedService.min_order}, Max: ${selectedService.max_order}`}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.quantity}</p>
                  )}
                </div>

                {/* Cost Calculation */}
                {orderForm.quantity && !formErrors.quantity && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total Cost:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₦{calculateCost().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
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
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmOrder}
        title="Confirm Order"
        message={`Are you sure you want to place this order for ₦${calculateCost().toLocaleString(undefined, { minimumFractionDigits: 2 })}?`}
        confirmText="Confirm Order"
        variant="info"
        loading={submitting}
      />
    </div>
  );
}
