import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Copy,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { phoneService } from '@/services';
import { getErrorMessage } from '@/services/api';
import { useAuth } from '@/stores/AuthContext';
import { ServiceIcon } from '@/components/icons';

interface OrderDetails {
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
    label: 'Waiting for SMS',
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

const COUNTRY_FLAGS: Record<string, string> = {
  nigeria: '🇳🇬',
  russia: '🇷🇺',
  usa: '🇺🇸',
  england: '🇬🇧',
  india: '🇮🇳',
  indonesia: '🇮🇩',
  philippines: '🇵🇭',
  china: '🇨🇳',
  netherlands: '🇳🇱',
  france: '🇫🇷',
  germany: '🇩🇪',
  canada: '🇨🇦',
  australia: '🇦🇺',
  brazil: '🇧🇷',
  mexico: '🇲🇽',
  spain: '🇪🇸',
  italy: '🇮🇹',
  poland: '🇵🇱',
  ukraine: '🇺🇦',
  vietnam: '🇻🇳',
  thailand: '🇹🇭',
  malaysia: '🇲🇾',
  singapore: '🇸🇬',
  japan: '🇯🇵',
  korea: '🇰🇷',
  turkey: '🇹🇷',
  egypt: '🇪🇬',
  'south africa': '🇿🇦',
  argentina: '🇦🇷',
  colombia: '🇨🇴',
};

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = async (showRefreshLoader = false) => {
    if (!id) return;

    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await phoneService.checkOrder(id);

      if (response.data.success && response.data.data) {
        setOrder(response.data.data);
      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      if (!showRefreshLoader) {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Auto-refresh for processing orders
  useEffect(() => {
    if (!order || !['processing'].includes(order.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.status, id]);

  // Countdown timer
  useEffect(() => {
    if (!order?.expires_at) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(order.expires_at!).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order?.expires_at]);

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Cancel order
  const handleCancel = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? You will receive a full refund to your wallet.'
    );

    if (!confirmed) return;

    setActionLoading('cancel');
    try {
      const response = await phoneService.cancelOrder(order.id);

      if (response.data.success) {
        toast.success(`Order cancelled! ₦${response.data.data.refunded_amount.toLocaleString()} refunded to your wallet.`);
        await refreshUser();
        await fetchOrder();
      } else {
        throw new Error('Failed to cancel order');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Finish order
  const handleFinish = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      'Mark this order as complete? This action cannot be undone.'
    );

    if (!confirmed) return;

    setActionLoading('finish');
    try {
      const response = await phoneService.finishOrder(order.id);

      if (response.data.success) {
        toast.success('Order marked as complete!');
        await fetchOrder();
      } else {
        throw new Error('Failed to complete order');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Report bad number
  const handleReport = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      'Report this number as non-working? You will receive a full refund to your wallet.'
    );

    if (!confirmed) return;

    setActionLoading('report');
    try {
      const response = await phoneService.reportNumber(order.id, 'Number not working');

      if (response.data.success) {
        toast.success(`Number reported! ₦${response.data.data.refunded_amount.toLocaleString()} refunded to your wallet.`);
        await refreshUser();
        await fetchOrder();
      } else {
        throw new Error('Failed to report number');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 ${config.color}`}
      >
        <Icon className="w-4 h-4" />
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
    return COUNTRY_FLAGS[countryCode?.toLowerCase()] || '🌍';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="btn-secondary p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>

        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="btn-secondary p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load order details'}</p>
            <button onClick={() => fetchOrder()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button onClick={() => navigate('/orders')} className="btn-secondary p-2 hover:scale-105 transition-transform flex-shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Order Details</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Order #{order.order_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {getStatusBadge(order.status)}
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="btn-secondary p-2 sm:p-2.5 hover:scale-105 transition-transform"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="card bg-gradient-to-br from-white to-gray-50">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 bg-primary-100 rounded-xl sm:rounded-2xl shrink-0">
              <span className="text-4xl sm:text-5xl">{getCountryFlag(order.country)}</span>
            </div>
            <div className="p-2.5 sm:p-3 bg-gray-100 rounded-xl sm:rounded-2xl shrink-0">
              <ServiceIcon service={order.product} size={40} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">{order.product}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <span className="capitalize">{order.country}</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{formatDate(order.created_at)}</span>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Amount Paid</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">₦{order.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Phone Number Section */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
            Phone Number
          </label>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-5">
              <p className="font-mono text-xl sm:text-2xl md:text-3xl font-bold text-primary-900 tracking-wider break-all">{order.phone}</p>
            </div>
            <button
              onClick={() => copyToClipboard(order.phone, 'phone')}
              className="p-3 sm:p-4 bg-primary-100 hover:bg-primary-200 rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
              title="Copy phone number"
            >
              {copiedField === 'phone' ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              )}
            </button>
          </div>
        </div>

        {/* SMS Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            SMS Verification Code
          </label>

          {order.sms && order.sms.length > 0 ? (
            <div className="space-y-3">
              {order.sms.map((sms, index) => (
                <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <span className="text-sm font-semibold text-green-800">SMS Code Received!</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(sms.code, `sms-${index}`)}
                      className="p-2 bg-green-200 hover:bg-green-300 rounded-lg transition-colors"
                      title="Copy SMS code"
                    >
                      {copiedField === `sms-${index}` ? (
                        <Check className="w-5 h-5 text-green-700" />
                      ) : (
                        <Copy className="w-5 h-5 text-green-700" />
                      )}
                    </button>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-xl p-4 mb-3">
                    <p className="font-mono text-4xl font-bold text-green-900 text-center tracking-widest">{sms.code}</p>
                  </div>
                  {sms.text && (
                    <div className="bg-white bg-opacity-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Full Message:</p>
                      <p className="text-sm text-gray-600">{sms.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : order.status === 'processing' ? (
            <div className="bg-gradient-to-br from-info-50 to-info-100 border-2 border-info-300 rounded-2xl p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-info-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-info-900 mb-2">Waiting for SMS...</p>
              <p className="text-sm text-info-700">
                This usually takes 1-5 minutes. The page refreshes automatically every 5 seconds.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">No SMS code received</p>
            </div>
          )}
        </div>

        {/* Timer */}
        {order.status === 'processing' && timeRemaining && timeRemaining !== 'Expired' && (
          <div className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-800" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Time Remaining</p>
                <p className="text-3xl font-bold font-mono text-yellow-900">{timeRemaining}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {order.status === 'processing' && (
          <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={handleCancel}
                disabled={actionLoading !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 text-sm sm:text-base"
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="hidden xs:inline">Cancel & Get Refund</span>
                <span className="xs:hidden">Cancel</span>
              </button>

              <button
                onClick={handleReport}
                disabled={actionLoading !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-300 text-sm sm:text-base"
              >
                {actionLoading === 'report' ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="hidden xs:inline">Report Bad Number</span>
                <span className="xs:hidden">Report</span>
              </button>
            </div>

            {order.sms && order.sms.length > 0 && (
              <button
                onClick={handleFinish}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {actionLoading === 'finish' ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                Mark as Complete
              </button>
            )}
          </div>
        )}

        {/* Status Messages */}
        {order.status === 'completed' && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center">
            <div className="p-3 bg-green-200 rounded-full w-fit mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-green-700" />
            </div>
            <p className="text-lg font-bold text-green-800">Order Completed Successfully!</p>
          </div>
        )}

        {['cancelled', 'refunded'].includes(order.status) && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-2xl p-6 text-center">
            <div className="p-3 bg-gray-200 rounded-full w-fit mx-auto mb-3">
              <XCircle className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-lg font-bold text-gray-700">
              Order {order.status === 'cancelled' ? 'Cancelled' : 'Refunded'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Amount has been refunded to your wallet</p>
          </div>
        )}

        {order.status === 'expired' && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl p-6 text-center">
            <div className="p-3 bg-red-200 rounded-full w-fit mx-auto mb-3">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-lg font-bold text-red-800">Order Expired</p>
            <p className="text-sm text-red-600 mt-1">This order has expired without receiving SMS</p>
          </div>
        )}
      </div>

      {/* Help Section */}
      {order.status === 'processing' && (
        <div className="card bg-gradient-to-br from-info-50 to-info-100 border-2 border-info-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-info-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-info-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Need Help?</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-info-600 font-bold">•</span>
                  <span>SMS codes typically arrive within <strong>1-5 minutes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info-600 font-bold">•</span>
                  <span>If no SMS arrives, you can <strong>cancel</strong> and get a full refund</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info-600 font-bold">•</span>
                  <span>Report bad/non-working numbers to help improve service quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info-600 font-bold">•</span>
                  <span>This page <strong>auto-refreshes every 5 seconds</strong> to check for new messages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
