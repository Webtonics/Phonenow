import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  Plus,
  X,
  Wifi,
  Clock,
  Calendar,
  QrCode,
  Shield,
  Phone,
  MessageSquare,
  MapPin,
  Signal,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { esimService, getErrorMessage } from '@/services';
import type { ESIMProfile, ESIMQRCodeData } from '@/types/esim';
import { getStatusColor, getStatusLabel } from '@/types/esim';

export function ESIMProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ESIMProfile | null>(null);
  const [qrCodeData, setQrCodeData] = useState<ESIMQRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await esimService.getProfile(parseInt(id!));
      if (response.data.success) {
        setProfile(response.data.data);
        // Fetch QR code separately
        fetchQrCode(parseInt(id!));
      } else {
        toast.error('eSIM profile not found');
        navigate('/esim/my-profiles');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/esim/my-profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async (profileId: number) => {
    setLoadingQr(true);
    try {
      const response = await esimService.getQrCode(profileId);
      if (response.data.success) {
        setQrCodeData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!profile) return;
    setRefreshing(true);
    try {
      const response = await esimService.refreshStatus(profile.id);
      if (response.data.success) {
        toast.success('Status refreshed successfully');
        setProfile(response.data.data.profile);
      } else {
        toast.error(response.data.message || 'Failed to refresh status');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    if (!profile) return;
    if (!confirm('Are you sure you want to cancel this eSIM? You will receive a refund to your wallet.')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await esimService.cancelProfile(profile.id);
      if (response.data.success) {
        toast.success(`eSIM cancelled. ₦${response.data.data.refunded_amount.toLocaleString()} refunded.`);
        navigate('/esim/my-profiles');
      } else {
        toast.error(response.data.message || 'Failed to cancel eSIM');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadQRCode = () => {
    const qrUrl = qrCodeData?.qr_code_url || profile?.qr_code_url;
    if (!qrUrl) return;
    window.open(qrUrl, '_blank');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDataUsagePercentage = () => {
    if (!profile || !profile.data_amount || profile.data_amount === 0) return 0;
    return Math.min(100, (profile.total_data_remaining / profile.data_amount) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading eSIM details...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const lpaString = qrCodeData?.lpa_string || profile.lpa_string || profile.qr_code_data;
  const qrCodeUrl = qrCodeData?.qr_code_url || profile.qr_code_url;
  const usagePercentage = getDataUsagePercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/esim/my-profiles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to My eSIMs</span>
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{profile.country_flag}</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.country_name} eSIM</h1>
                  <p className="text-primary-100">Order #{profile.order_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(profile.status)}`}>
                  {getStatusLabel(profile.status)}
                </span>
                {['new', 'active', 'pending', 'processing'].includes(profile.status) && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh status"
                  >
                    <RefreshCw className={`h-5 w-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            <div className="p-4 text-center">
              <Wifi className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-bold text-gray-900">{profile.data_formatted}</p>
            </div>
            <div className="p-4 text-center">
              <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-bold text-gray-900">{profile.duration_days} days</p>
            </div>
            <div className="p-4 text-center">
              <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Purchased</p>
              <p className="font-bold text-gray-900 text-sm">{formatDate(profile.created_at).split(',')[0]}</p>
            </div>
            <div className="p-4 text-center">
              <Shield className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Price Paid</p>
              <p className="font-bold text-gray-900">₦{profile.selling_price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary-500" />
                  Activation QR Code
                </h2>
              </div>

              <div className="p-6">
                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                  {loadingQr ? (
                    <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                      <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-inner mb-4">
                      <img src={qrCodeUrl} alt="eSIM QR Code" className="w-48 h-48" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                      <div className="text-center p-4">
                        <QrCode className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">QR code pending</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="w-full space-y-2">
                    {qrCodeUrl && (
                      <button
                        onClick={downloadQRCode}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                        Download QR Code
                      </button>
                    )}
                    {lpaString && (
                      <button
                        onClick={() => copyToClipboard(lpaString, 'Activation code')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Copy className="h-5 w-5" />
                        Copy LPA Code
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Code */}
                {lpaString && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Manual Activation Code:</p>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <code className="flex-1 text-xs text-gray-600 break-all font-mono">{lpaString}</code>
                      <button
                        onClick={() => copyToClipboard(lpaString, 'Activation code')}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Usage */}
            {profile.status === 'active' && profile.total_data_remaining !== undefined && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-primary-500" />
                  Data Usage
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Data Remaining</span>
                      <span className="font-semibold text-gray-900">
                        {profile.data_formatted}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                        style={{ width: `${usagePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-gray-500">{usagePercentage.toFixed(0)}% remaining</p>
                      {usagePercentage < 20 && (
                        <span className="text-xs text-red-600 font-medium">Low data warning</span>
                      )}
                    </div>
                  </div>

                  {profile.can_topup && (
                    <button
                      onClick={() => navigate(`/esim/topup/${profile.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Top Up Data
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                Profile Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {profile.iccid && (
                  <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">ICCID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium text-gray-900 text-sm">{profile.iccid}</p>
                      <button
                        onClick={() => copyToClipboard(profile.iccid!, 'ICCID')}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
                {profile.transaction_id && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                    <p className="font-medium text-gray-900 text-sm truncate">{profile.transaction_id}</p>
                  </div>
                )}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {profile.country_flag} {profile.country_name} ({profile.country_code})
                  </p>
                </div>
                {profile.zendit_status && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Provider Status</p>
                    <p className="font-medium text-gray-900 text-sm uppercase">{profile.zendit_status}</p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Features</p>
                <div className="flex flex-wrap gap-2">
                  {profile.has_voice && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      {profile.voice_formatted || 'Voice Calls'}
                    </span>
                  )}
                  {profile.has_sms && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info-50 text-info-700 rounded-lg text-sm font-medium">
                      <MessageSquare className="h-4 w-4" />
                      {profile.sms_formatted || 'SMS'}
                    </span>
                  )}
                  {!profile.has_voice && !profile.has_sms && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">
                      <Signal className="h-4 w-4" />
                      Data Only
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-500" />
                Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Purchased</p>
                    <p className="text-sm text-gray-500">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
                {profile.activated_at && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Activated</p>
                      <p className="text-sm text-gray-500">{formatDate(profile.activated_at)}</p>
                    </div>
                  </div>
                )}
                {profile.expires_at && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(profile.expires_at) < new Date() ? 'Expired' : 'Expires'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(profile.expires_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subscriptions/Top-ups */}
            {profile.subscriptions && profile.subscriptions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary-500" />
                  Data Top-ups ({profile.subscriptions.length})
                </h2>
                <div className="space-y-3">
                  {profile.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{sub.data_formatted}</p>
                        <p className="text-sm text-gray-500">{formatDate(sub.created_at).split(',')[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₦{sub.selling_price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {sub.data_remaining_formatted} remaining
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installation Instructions */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Smartphone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Installation Guide</h3>
                    <p className="text-sm text-gray-500">Step-by-step activation instructions</p>
                  </div>
                </div>
                {showInstructions ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {showInstructions && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-6 space-y-6">
                    {/* iPhone */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">iPhone</h4>
                      <ol className="space-y-2 text-sm text-gray-600 ml-4">
                        <li>1. Go to <strong>Settings → Cellular → Add eSIM</strong></li>
                        <li>2. Select <strong>"Use QR Code"</strong></li>
                        <li>3. Scan the QR code above</li>
                        <li>4. Tap <strong>"Add Cellular Plan"</strong></li>
                        <li>5. Enable <strong>Data Roaming</strong> when traveling</li>
                      </ol>
                    </div>

                    {/* Android */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Android</h4>
                      <ol className="space-y-2 text-sm text-gray-600 ml-4">
                        <li>1. Go to <strong>Settings → Connections → SIM Manager</strong></li>
                        <li>2. Tap <strong>"Add eSIM"</strong></li>
                        <li>3. Select <strong>"Scan QR code"</strong></li>
                        <li>4. Scan the QR code above</li>
                        <li>5. Enable <strong>Mobile Data</strong> and <strong>Data Roaming</strong></li>
                      </ol>
                    </div>

                    {/* Tips */}
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-semibold mb-1">Pro Tips:</p>
                          <ul className="list-disc ml-4 space-y-1">
                            <li>Install your eSIM before traveling</li>
                            <li>Make sure you have a stable WiFi connection during installation</li>
                            <li>The validity period starts after first network connection</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {profile.can_topup && (
                <button
                  onClick={() => navigate(`/esim/topup/${profile.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Top Up Data
                </button>
              )}
              <button
                onClick={() => navigate('/esim/packages')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Buy Another eSIM
                <ExternalLink className="h-5 w-5" />
              </button>
              {profile.status === 'new' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5" />
                      Cancel & Refund
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
