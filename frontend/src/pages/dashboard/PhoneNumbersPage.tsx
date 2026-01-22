import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Globe,
  Search,
  Loader2,
  Copy,
  Check,
  X,
  RefreshCw,
  Clock,
  MessageSquare,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { phoneService, getErrorMessage } from '@/services';
import { useAuth } from '@/stores/AuthContext';

interface Country {
  name?: string;
  iso?: number | string;
  prefix?: string | number;
  text_en?: string;
}

interface Service {
  name: string;
  display_name: string;
  quantity: number;
  base_price: number;
  price: number;
  category: string;
}

interface SMS {
  created_at: string;
  text: string;
  code: string;
  sender: string;
}

interface ActiveOrder {
  id: number;
  order_number: string;
  phone: string;
  product: string;
  operator: string;
  country: string;
  status: string;
  price: number;
  sms: SMS[];
  expires: string | null;
  created_at: string;
}

// Popular countries to show first
const POPULAR_COUNTRIES = ['nigeria', 'russia', 'usa', 'england', 'india', 'indonesia', 'philippines'];

// Popular services to show first
const POPULAR_SERVICES = ['whatsapp', 'telegram', 'google', 'facebook', 'instagram', 'twitter', 'tiktok', 'amazon'];

// Service icons mapping
const SERVICE_ICONS: Record<string, string> = {
  whatsapp: '💬',
  telegram: '✈️',
  google: '🔍',
  facebook: '👥',
  instagram: '📷',
  twitter: '🐦',
  tiktok: '🎵',
  amazon: '📦',
  netflix: '🎬',
  spotify: '🎧',
  uber: '🚗',
  snapchat: '👻',
  linkedin: '💼',
  microsoft: '🪟',
  apple: '🍎',
  discord: '🎮',
  reddit: '🤖',
  youtube: '📺',
  twitch: '🎮',
  gmail: '📧',
};

export const PhoneNumbersPage = () => {
  const { refreshUser } = useAuth();
  const [countries, setCountries] = useState<Record<string, Country>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [buyingService, setBuyingService] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await phoneService.getCountries();
        if (response.data.success) {
          setCountries(response.data.data as Record<string, Country>);

          // Show warning if API returned one
          if ('warning' in response.data && response.data.warning) {
            toast.warning(response.data.warning as string);
          }
        }
      } catch (error) {
        toast.error('Failed to load countries. Please check your internet connection.');
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch services when country changes
  useEffect(() => {
    if (!selectedCountry) return;

    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response = await phoneService.getServices(selectedCountry, 'any');
        if (response.data.success) {
          setServices(response.data.data as Service[]);

          // Show warning if API returned one (e.g., connectivity issues)
          if ('warning' in response.data && response.data.warning) {
            toast.warning(response.data.warning as string);
          }
        }
      } catch (error) {
        toast.error('Failed to load services. Please check your internet connection.');
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedCountry]);

  // Fetch active orders
  const fetchActiveOrders = useCallback(async () => {
    try {
      const pendingResponse = await phoneService.getOrders({ status: 'pending' });
      const activeResponse = await phoneService.getOrders({ status: 'active' });

      const pendingOrders = pendingResponse.data?.data || [];
      const activeOrdersList = activeResponse.data?.data || [];

      setActiveOrders([...pendingOrders, ...activeOrdersList]);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);

  // Poll for SMS on active orders
  useEffect(() => {
    if (activeOrders.length === 0) return;

    const interval = setInterval(async () => {
      for (const order of activeOrders) {
        if (order.status === 'pending' || order.status === 'active') {
          try {
            const response = await phoneService.checkOrder(order.id.toString());
            if (response.data.success) {
              setActiveOrders(prev =>
                prev.map(o =>
                  o.id === order.id
                    ? { ...o, ...response.data.data }
                    : o
                )
              );

              // Notify if SMS received
              if (response.data.data.sms?.length > 0 && order.sms?.length === 0) {
                toast.success(`SMS received for ${order.product}!`);
              }
            }
          } catch (error) {
            console.error('Failed to check order:', error);
          }
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [activeOrders]);

  // Buy number
  const handleBuyNumber = async (service: Service) => {
    setBuyingService(service.name);
    try {
      const response = await phoneService.buyNumber(selectedCountry, 'any', service.name);
      if (response.data.success) {
        toast.success('Number purchased successfully!');
        fetchActiveOrders();
        refreshUser();
      } else {
        toast.error(response.data.message || 'Failed to purchase number');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBuyingService(null);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: number) => {
    try {
      const response = await phoneService.cancelOrder(orderId.toString());
      if (response.data.success) {
        toast.success('Order cancelled and refunded');
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        refreshUser();
      } else {
        toast.error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Finish order
  const handleFinishOrder = async (orderId: number) => {
    try {
      const response = await phoneService.finishOrder(orderId.toString());
      if (response.data.success) {
        toast.success('Order completed');
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        toast.error(response.data.message || 'Failed to finish order');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter and sort services
  const filteredServices = services
    .filter(s =>
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Popular services first
      const aPopular = POPULAR_SERVICES.indexOf(a.name.toLowerCase());
      const bPopular = POPULAR_SERVICES.indexOf(b.name.toLowerCase());
      if (aPopular !== -1 && bPopular === -1) return -1;
      if (aPopular === -1 && bPopular !== -1) return 1;
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      // Then by quantity
      return b.quantity - a.quantity;
    });

  // Sort countries
  const sortedCountries = Object.entries(countries).sort(([keyA], [keyB]) => {
    const aPopular = POPULAR_COUNTRIES.indexOf(keyA);
    const bPopular = POPULAR_COUNTRIES.indexOf(keyB);
    if (aPopular !== -1 && bPopular === -1) return -1;
    if (aPopular === -1 && bPopular !== -1) return 1;
    if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
    return keyA.localeCompare(keyB);
  });

  // Suppress unused var warning
  void loadingOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Buy Phone Numbers</h1>
        <button
          onClick={fetchActiveOrders}
          className="btn-outline flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Active Orders ({activeOrders.length})
          </h2>
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{order.product}</p>
                    <p className="text-sm text-gray-500">{order.country} • {order.operator}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status === 'active' ? 'SMS Received' : 'Waiting for SMS'}
                  </span>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-lg">{order.phone}</span>
                  <button
                    onClick={() => copyToClipboard(order.phone, `phone-${order.id}`)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedCode === `phone-${order.id}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* SMS Codes */}
                {order.sms && order.sms.length > 0 ? (
                  <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-2">Verification Code:</p>
                    {order.sms.map((sms, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-mono text-2xl font-bold text-green-600">
                          {sms.code || sms.text}
                        </span>
                        <button
                          onClick={() => copyToClipboard(sms.code || sms.text, `code-${order.id}-${idx}`)}
                          className="btn-primary py-1 px-3 text-sm"
                        >
                          {copiedCode === `code-${order.id}-${idx}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Waiting for SMS...</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {order.status === 'active' && order.sms?.length > 0 && (
                    <button
                      onClick={() => handleFinishOrder(order.id)}
                      className="btn-primary py-1 px-3 text-sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </button>
                  )}
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn-outline py-1 px-3 text-sm text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel & Refund
                  </button>
                  <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ₦{order.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          Select Country
        </h2>

        {loadingCountries ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-primary-500 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <span className="font-medium capitalize">
                  {selectedCountry.replace(/_/g, ' ')}
                </span>
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCountryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {sortedCountries.map(([key]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCountry(key);
                      setShowCountryDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left ${
                      selectedCountry === key ? 'bg-primary-50 text-primary-600' : ''
                    }`}
                  >
                    <span className="text-lg">🌍</span>
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary-500" />
            Available Services
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No services available for this country</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">
                    {SERVICE_ICONS[service.name.toLowerCase()] || '📱'}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{service.display_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                      service.quantity > 100
                        ? 'bg-green-100 text-green-700'
                        : service.quantity > 10
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {service.quantity} available
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600">
                    ₦{service.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleBuyNumber(service)}
                    disabled={buyingService === service.name || service.quantity === 0}
                    className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
                  >
                    {buyingService === service.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Buy'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
