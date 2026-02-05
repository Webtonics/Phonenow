import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { phoneService } from '@/services';
import { getErrorMessage } from '@/services/api';
import { ServiceIcon } from '@/components/icons';

interface Order {
  id: number;
  order_number: string;
  phone: string;
  product: string;
  operator: string;
  country: string;
  status: string;
  price: number;
  sms: { code: string; text: string }[];
  expires_at?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  processing: {
    label: 'Processing',
    color: 'bg-info-100 text-info-700 border-info-200',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: AlertCircle,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = { per_page: 50 };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await phoneService.getOrders(params);

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      nigeria: '🇳🇬',
      netherlands: '🇳🇱',
      usa: '🇺🇸',
      uk: '🇬🇧',
      germany: '🇩🇪',
      france: '🇫🇷',
      canada: '🇨🇦',
      australia: '🇦🇺',
      india: '🇮🇳',
      china: '🇨🇳',
    };
    return flags[countryCode?.toLowerCase()] || '🌍';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="card">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => fetchOrders()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
        {['all', 'processing', 'completed', 'cancelled', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Orders Yet' : `No ${filter} Orders`}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {filter === 'all'
                ? 'Your order history will appear here once you make a purchase.'
                : `You don't have any ${filter} orders.`}
            </p>
            {filter === 'all' && (
              <Link to="/phone-numbers" className="btn-primary inline-block">
                <Phone className="w-4 h-4 inline mr-2" />
                Buy Phone Number
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card hover:shadow-lg transition-all block"
            >
              <div className="flex flex-col items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 w-full">
                  {/* Order Header */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mt-0.5">
                      <span className="text-xl sm:text-2xl">{getCountryFlag(order.country)}</span>
                      <ServiceIcon service={order.product} size={20} className="hidden sm:block" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                        <span className="block truncate">{order.product}</span>
                        <span className="text-xs sm:text-sm text-gray-500 font-normal">
                          #{order.order_number}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-3">
                    <div className="col-span-2 xs:col-span-1">
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <p className="font-mono text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {order.phone}
                      </p>
                    </div>
                    <div className="hidden xs:block sm:block">
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">
                        {order.country}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs text-gray-500 mb-1">Operator</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">
                        {order.operator}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-sm sm:text-base font-bold text-primary-600">
                        ₦{order.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* SMS Status */}
                  {order.sms && order.sms.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                      <p className="text-xs text-green-600 font-medium mb-1">SMS Received</p>
                      <p className="font-mono text-base sm:text-lg font-bold text-green-900 break-all">
                        {order.sms[0].code}
                      </p>
                    </div>
                  ) : order.status === 'processing' ? (
                    <div className="bg-info-50 border border-info-200 rounded-lg p-2.5 sm:p-3">
                      <p className="text-xs sm:text-sm text-info-700 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        Waiting for SMS...
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Status and Arrow */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                  {getStatusBadge(order.status)}
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
