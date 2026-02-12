import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/AuthContext';
import {
  Search,
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
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { smmService, getErrorMessage } from '@/services';
import type { SmmCategory, SmmService, SmmOrder, SmmOrderStatus } from '@/types';
import { getSmmStatusColor, getSmmStatusLabel } from '@/types/smm';

const categoryIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-6 h-6" />,
  tiktok: <Play className="w-6 h-6" />,
  youtube: <Youtube className="w-6 h-6" />,
  twitter: <Twitter className="w-6 h-6" />,
  facebook: <Facebook className="w-6 h-6" />,
  telegram: <MessageCircle className="w-6 h-6" />,
};

const serviceTypeIcons: Record<string, React.ReactNode> = {
  followers: <Users className="w-4 h-4" />,
  likes: <Heart className="w-4 h-4" />,
  views: <Eye className="w-4 h-4" />,
  comments: <MessageCircle className="w-4 h-4" />,
  shares: <Share2 className="w-4 h-4" />,
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

  // Order form state
  const [orderForm, setOrderForm] = useState({
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
  }, [selectedCategory, searchQuery]);

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
        search: searchQuery || undefined,
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
      const response = await smmService.getOrders({ per_page: 50 });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSubmit = async () => {
    if (!selectedService) return;

    const quantity = parseInt(orderForm.quantity);
    if (isNaN(quantity) || quantity < selectedService.min_order || quantity > selectedService.max_order) {
      toast.error(`Quantity must be between ${selectedService.min_order} and ${selectedService.max_order}`);
      return;
    }

    if (!orderForm.link.trim()) {
      toast.error('Please enter a valid link');
      return;
    }

    const totalCost = (quantity / 1000) * selectedService.price_per_1000;
    if (user && user.balance < totalCost) {
      toast.error('Insufficient balance');
      return;
    }

    setOrdering(true);
    try {
      const response = await smmService.createOrder({
        service_id: selectedService.id,
        link: orderForm.link,
        quantity: quantity,
      });

      if (response.success) {
        toast.success('Order placed successfully!');
        setSelectedService(null);
        setOrderForm({ link: '', quantity: '' });
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

  const getStatusBadge = (status: SmmOrderStatus) => {
    const color = getSmmStatusColor(status);
    const label = getSmmStatusLabel(status);

    const config: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
      green: { icon: <CheckCircle className="w-3 h-3" />, bg: 'bg-green-50', text: 'text-green-700' },
      yellow: { icon: <Clock className="w-3 h-3" />, bg: 'bg-yellow-50', text: 'text-yellow-700' },
      blue: { icon: <RefreshCw className="w-3 h-3" />, bg: 'bg-blue-50', text: 'text-blue-700' },
      red: { icon: <XCircle className="w-3 h-3" />, bg: 'bg-red-50', text: 'text-red-700' },
      gray: { icon: <Clock className="w-3 h-3" />, bg: 'bg-gray-50', text: 'text-gray-500' },
      orange: { icon: <AlertCircle className="w-3 h-3" />, bg: 'bg-orange-50', text: 'text-orange-700' },
    };

    const s = config[color] || config.gray;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {label}
      </span>
    );
  };

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
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                const icon = categoryIcons[category.slug.toLowerCase()] || <TrendingUp className="w-6 h-6" />;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-150 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {icon}
                    </div>
                    <h3 className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{category.services_count} services</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="card !p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="input !pl-10"
              />
            </div>
          </div>

          {/* Services Grid */}
          {loadingServices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
            </div>
          ) : services.length === 0 ? (
            <div className="card !p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No services found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const typeIcon = serviceTypeIcons[service.type] || <TrendingUp className="w-4 h-4" />;

                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="card !p-4 text-left hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                        {typeIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{service.name}</h3>
                        <p className="text-xs text-gray-500">{service.category.name}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary-600">
                          ₦{service.price_per_1000.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">per 1000</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Min: {service.min_order.toLocaleString()}</span>
                        <span>•</span>
                        <span>Max: {service.max_order.toLocaleString()}</span>
                      </div>

                      {service.average_time_minutes && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>~{Math.floor(service.average_time_minutes / 60)}h delivery</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex gap-2">
                          {service.refill_enabled && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full">
                              {service.refill_days}d Refill
                            </span>
                          )}
                          {service.cancel_enabled && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                              Cancellable
                            </span>
                          )}
                        </div>
                      </div>
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
                  className="p-4 rounded-xl border border-gray-150 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{order.service.name}</h3>
                      <p className="text-xs text-gray-500">{order.service.category}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <ExternalLink className="w-3 h-3" />
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
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full transition-all"
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
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
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
      )}

      {/* Order Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
              <h2 className="text-lg font-bold text-gray-900">{selectedService.name}</h2>
              <p className="text-sm text-gray-500">{selectedService.category.name}</p>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5">
              {/* Pricing */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary-600">
                  ₦{selectedService.price_per_1000.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">per 1000</span>
              </div>

              {/* Description */}
              {selectedService.description && (
                <p className="text-sm text-gray-600">{selectedService.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-xs text-gray-500">Min Order</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedService.min_order.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Max Order</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedService.max_order.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Link Input */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Social Media Link</label>
                <input
                  type="url"
                  value={orderForm.link}
                  onChange={(e) => setOrderForm({ ...orderForm, link: e.target.value })}
                  placeholder="https://instagram.com/username"
                  className="input"
                />
              </div>

              {/* Quantity Input */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Quantity</label>
                <input
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                  placeholder={`Min: ${selectedService.min_order}`}
                  min={selectedService.min_order}
                  max={selectedService.max_order}
                  className="input"
                />
              </div>

              {/* Total Cost */}
              {orderForm.quantity && (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Cost</span>
                    <span className="text-xl font-bold text-primary-600">
                      ₦
                      {Math.ceil(
                        (parseInt(orderForm.quantity) / 1000) * selectedService.price_per_1000
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Your Balance</span>
                    <span className="text-sm font-semibold text-gray-700">₦{user?.balance.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Order Button */}
              <button
                onClick={handleOrderSubmit}
                disabled={ordering || !orderForm.link || !orderForm.quantity}
                className="btn-primary w-full !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}
    </div>
  );
};
