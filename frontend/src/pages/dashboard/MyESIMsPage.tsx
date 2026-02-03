import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Wifi,
  QrCode,
  Copy,
  RefreshCw,
  X,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Hourglass,
  Phone,
  MessageSquare,
  Signal,
  Calendar,
  Zap,
} from 'lucide-react';
import { esimService, getErrorMessage } from '@/services';
import type { ESIMProfile } from '@/types/esim';
import { getStatusColor, getStatusLabel } from '@/types/esim';

type StatusFilter = '' | 'new' | 'pending' | 'processing' | 'active' | 'expired' | 'cancelled' | 'failed';

const STATUS_CONFIG: Record<StatusFilter, { icon: any; color: string; bgColor: string }> = {
  '': { icon: Wifi, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  new: { icon: Zap, color: 'text-info-600', bgColor: 'bg-info-100' },
  pending: { icon: Hourglass, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  processing: { icon: RefreshCw, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  active: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  expired: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  failed: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function MyESIMsPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ESIMProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('');
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [selectedStatus]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await esimService.getMyProfiles(selectedStatus || undefined);
      if (response.data.success) {
        setProfiles(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async (id: number) => {
    setRefreshingId(id);
    try {
      const response = await esimService.refreshStatus(id);
      if (response.data.success) {
        toast.success('Status refreshed successfully');
        await fetchProfiles();
      } else {
        toast.error(response.data.message || 'Failed to refresh status');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRefreshingId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this eSIM? You will receive a refund to your wallet.')) {
      return;
    }

    setCancellingId(id);
    try {
      const response = await esimService.cancelProfile(id);
      if (response.data.success) {
        toast.success(`eSIM cancelled. ₦${response.data.data.refunded_amount.toLocaleString()} refunded to your wallet.`);
        await fetchProfiles();
      } else {
        toast.error(response.data.message || 'Failed to cancel eSIM');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancellingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDataUsagePercentage = (profile: ESIMProfile) => {
    if (!profile.data_amount || profile.data_amount === 0) return 0;
    return Math.min(100, (profile.total_data_remaining / profile.data_amount) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Count profiles by status
  const statusCounts = profiles.reduce((acc, profile) => {
    acc[profile.status] = (acc[profile.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My eSIMs</h1>
            <p className="mt-1 text-gray-600">
              Manage your eSIM profiles and track data usage
            </p>
          </div>
          <button
            onClick={() => navigate('/esim/packages')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Buy New eSIM
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {(['', 'active', 'new', 'pending', 'expired', 'cancelled'] as StatusFilter[]).map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const count = status === '' ? profiles.length : (statusCounts[status] || 0);

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === status
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${selectedStatus === status ? 'text-white' : config.color}`} />
                  <span>{status === '' ? 'All' : getStatusLabel(status as any)}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedStatus === status
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && profiles.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <Wifi className="h-10 w-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedStatus ? `No ${getStatusLabel(selectedStatus as any)} eSIMs` : 'No eSIMs Yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {selectedStatus
                ? 'Try selecting a different status filter or browse all eSIMs.'
                : 'Get started with your first eSIM and stay connected anywhere in the world.'}
            </p>
            <div className="flex justify-center gap-3">
              {selectedStatus && (
                <button
                  onClick={() => setSelectedStatus('')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  View All
                </button>
              )}
              <button
                onClick={() => navigate('/esim/packages')}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Browse Packages
              </button>
            </div>
          </div>
        )}

        {/* eSIM Profiles Grid */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profiles.map((profile) => {
              const statusConfig = STATUS_CONFIG[profile.status as StatusFilter] || STATUS_CONFIG[''];
              const StatusIcon = statusConfig.icon;
              const usagePercentage = getDataUsagePercentage(profile);

              return (
                <div
                  key={profile.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{profile.country_flag}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {profile.country_name}
                          </h3>
                          <p className="text-sm text-gray-500">#{profile.order_no}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(profile.status)}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {getStatusLabel(profile.status)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Data Usage Bar */}
                    {profile.status === 'active' && profile.total_data_remaining !== undefined && (
                      <div className="mb-5">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Data Remaining</span>
                          <span className="font-semibold text-gray-900">
                            {profile.data_formatted}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                            style={{ width: `${usagePercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {usagePercentage.toFixed(0)}% remaining
                        </p>
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Wifi className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Data</p>
                        <p className="font-semibold text-gray-900 text-sm">{profile.data_formatted}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900 text-sm">{profile.duration_days} days</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Expires</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {profile.expires_at ? formatDate(profile.expires_at) : 'Not started'}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {profile.has_voice && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          <Phone className="h-3 w-3" />
                          {profile.voice_formatted || 'Voice'}
                        </span>
                      )}
                      {profile.has_sms && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-info-50 text-info-700 rounded text-xs font-medium">
                          <MessageSquare className="h-3 w-3" />
                          {profile.sms_formatted || 'SMS'}
                        </span>
                      )}
                      {profile.iccid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(profile.iccid!, 'ICCID');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
                        >
                          <Signal className="h-3 w-3" />
                          ICCID
                          <Copy className="h-3 w-3 ml-1" />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/esim/profile/${profile.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      {['new', 'active', 'pending', 'processing'].includes(profile.status) && (
                        <button
                          onClick={() => handleRefreshStatus(profile.id)}
                          disabled={refreshingId === profile.id}
                          className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                          title="Refresh status"
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshingId === profile.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      {profile.can_topup && (
                        <button
                          onClick={() => navigate(`/esim/topup/${profile.id}`)}
                          className="p-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Top up data"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}

                      {profile.status === 'new' && (
                        <button
                          onClick={() => handleCancel(profile.id)}
                          disabled={cancellingId === profile.id}
                          className="p-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Cancel and refund"
                        >
                          {cancellingId === profile.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        {!loading && profiles.length > 0 && (
          <div className="mt-8 bg-primary-50 rounded-xl p-6 border border-primary-100">
            <h3 className="font-semibold text-primary-900 mb-2">Need Help?</h3>
            <p className="text-sm text-primary-700 mb-4">
              If your eSIM isn't activating or you're having trouble connecting, try refreshing the status
              or check our installation guide.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/esim/packages')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Buy Another eSIM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
