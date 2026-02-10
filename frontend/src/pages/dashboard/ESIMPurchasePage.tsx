import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Wifi,
  Globe,
  Clock,
  ArrowLeft,
  Wallet,
  CheckCircle,
  Download,
  Copy,
  Phone,
  MessageSquare,
  MapPin,
  Signal,
  Shield,
  Zap,
  AlertCircle,
  Smartphone,
  QrCode,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { esimService, getErrorMessage } from '@/services';
import { useAuth } from '@/stores/AuthContext';
import type { ESIMPackage, ESIMProfile, ESIMQRCodeData } from '@/types/esim';

export function ESIMPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [pkg, setPkg] = useState<ESIMPackage | null>(null);
  const [purchasedProfile, setPurchasedProfile] = useState<ESIMProfile | null>(null);
  const [qrCodeData, setQrCodeData] = useState<ESIMQRCodeData | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPackage();
    }
  }, [id]);

  const fetchPackage = async () => {
    setLoading(true);
    try {
      const response = await esimService.getPackage(parseInt(id!));
      if (response.data.success) {
        setPkg(response.data.data);
      } else {
        toast.error('Package not found');
        navigate('/esim/packages');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/esim/packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!pkg || !user) return;

    if (user.balance < pkg.selling_price) {
      toast.error('Insufficient balance. Please fund your wallet.');
      return;
    }

    setPurchasing(true);
    try {
      const response = await esimService.purchaseProfile(pkg.id);
      if (response.data.success) {
        toast.success('eSIM purchased successfully!');
        setPurchasedProfile(response.data.data.profile);
        await refreshUser();

        // Fetch QR code data
        if (response.data.data.profile.id) {
          fetchQrCode(response.data.data.profile.id);
        }
      } else {
        toast.error(response.data.message || 'Purchase failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPurchasing(false);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadQRCode = () => {
    const qrUrl = qrCodeData?.qr_code_url || purchasedProfile?.qr_code_url;
    if (!qrUrl) return;
    window.open(qrUrl, '_blank');
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return null;
  }

  // Purchase Success View
  if (purchasedProfile) {
    const isAwaitingFulfillment = purchasedProfile.status === 'awaiting_fulfillment';
    const lpaString = qrCodeData?.lpa_string || purchasedProfile.lpa_string || purchasedProfile.qr_code_data;
    const qrCodeUrl = qrCodeData?.qr_code_url || purchasedProfile.qr_code_url;

    // Awaiting Fulfillment View (Manual Mode)
    if (isAwaitingFulfillment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50/30 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Order Placed Header */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center border border-amber-100">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                <Clock className="h-12 w-12 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order Placed Successfully!
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Your eSIM order for <span className="font-semibold">{purchasedProfile.country_name}</span> is being processed.
                You'll receive an email notification when your eSIM is ready to install.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Order Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Order Number</p>
                  <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.order_no}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {purchasedProfile.country_name}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Data Allowance</p>
                  <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.data_formatted}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Validity</p>
                  <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.duration_days} days</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                  <p className="font-semibold text-gray-900 text-sm">₦{purchasedProfile.selling_price.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Awaiting Fulfillment
                  </span>
                </div>
              </div>
            </div>

            {/* Processing Info */}
            <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">What happens next?</h4>
                  <ul className="text-sm text-amber-800 space-y-1.5">
                    <li>Your order is in our processing queue</li>
                    <li>We'll prepare your eSIM credentials shortly</li>
                    <li>You'll receive an email when your eSIM is ready</li>
                    <li>You can also check your order status in "My eSIMs"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/esim/my-profiles')}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-4 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
              >
                View My eSIMs
                <ExternalLink className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/esim/packages')}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 py-4 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Browse More Packages
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center border border-green-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Purchase Successful!
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Your eSIM for <span className="font-semibold">{purchasedProfile.country_name}</span> is ready.
              Follow the instructions below to activate.
            </p>
          </div>

          {/* QR Code Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-center">
              <QrCode className="h-8 w-8 text-white mx-auto mb-2" />
              <h2 className="text-xl font-bold text-white">Your eSIM QR Code</h2>
              <p className="text-primary-100 text-sm mt-1">Scan this code with your device to install the eSIM</p>
            </div>

            <div className="p-8">
              <div className="flex flex-col items-center">
                {/* QR Code Display */}
                {loadingQr ? (
                  <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading QR Code...</p>
                    </div>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="bg-white p-4 rounded-2xl border-4 border-gray-100 shadow-inner mb-6">
                    <img
                      src={qrCodeUrl}
                      alt="eSIM QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                    <div className="text-center p-4">
                      <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        QR code will be available shortly.
                        Use the manual code below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {qrCodeUrl && (
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Download QR Code
                    </button>
                  )}
                  {lpaString && (
                    <button
                      onClick={() => copyToClipboard(lpaString, 'Activation code')}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="h-5 w-5" />
                      Copy Activation Code
                    </button>
                  )}
                </div>

                {/* Manual Activation Code */}
                {lpaString && (
                  <div className="w-full max-w-xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Manual Activation Code (LPA):
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <code className="flex-1 text-xs text-gray-600 break-all font-mono">
                        {lpaString}
                      </code>
                      <button
                        onClick={() => copyToClipboard(lpaString, 'Activation code')}
                        className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0 transition-colors"
                      >
                        <Copy className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* eSIM Details Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-500" />
              eSIM Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Order Number</p>
                <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.order_no}</p>
              </div>
              {purchasedProfile.iccid && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">ICCID</p>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{purchasedProfile.iccid}</p>
                    <button
                      onClick={() => copyToClipboard(purchasedProfile.iccid!, 'ICCID')}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Copy className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Country</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {purchasedProfile.country_flag} {purchasedProfile.country_name}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Data Allowance</p>
                <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.data_formatted}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Validity</p>
                <p className="font-semibold text-gray-900 text-sm">{purchasedProfile.duration_days} days</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-info-100 text-info-800">
                  {purchasedProfile.status}
                </span>
              </div>
            </div>
          </div>

          {/* Installation Instructions - Collapsible */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Installation Instructions</h3>
                  <p className="text-sm text-gray-500">How to install and activate your eSIM</p>
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
                  {/* iPhone Instructions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">📱</span> iPhone
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-600 ml-7">
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">1.</span>
                        <span>Go to <strong>Settings → Cellular → Add eSIM</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">2.</span>
                        <span>Select <strong>"Use QR Code"</strong> and scan the code above</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">3.</span>
                        <span>Tap <strong>"Add Cellular Plan"</strong> to confirm</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">4.</span>
                        <span>When traveling, enable <strong>Data Roaming</strong> for this line</span>
                      </li>
                    </ol>
                  </div>

                  {/* Android Instructions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">🤖</span> Android (Samsung, Pixel, etc.)
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-600 ml-7">
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">1.</span>
                        <span>Go to <strong>Settings → Connections → SIM Manager</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">2.</span>
                        <span>Tap <strong>"Add eSIM"</strong> then <strong>"Scan QR code"</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">3.</span>
                        <span>Scan the QR code and follow the prompts</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary-500 w-5">4.</span>
                        <span>Enable <strong>Mobile Data</strong> and <strong>Data Roaming</strong> when ready</span>
                      </li>
                    </ol>
                  </div>

                  {/* Important Note */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-800">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Important Notes:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Install your eSIM <strong>before</strong> traveling for best results</li>
                        <li>Keep your primary SIM active for calls/SMS if needed</li>
                        <li>The eSIM validity period starts after first connection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/esim/my-profiles')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              View My eSIMs
              <ExternalLink className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/esim/packages')}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 py-4 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Buy Another eSIM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Purchase Confirmation View
  const canAfford = user && user.balance >= pkg.selling_price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/esim/packages')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Packages</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header with Country */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{pkg.country_flag}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{pkg.country_name}</h1>
                    <p className="text-primary-100">{pkg.speeds_formatted} Network</p>
                  </div>
                </div>
              </div>

              {/* Package Features */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Wifi className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Data</p>
                      <p className="text-lg font-bold text-gray-900">{pkg.data_formatted}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Validity</p>
                      <p className="text-lg font-bold text-gray-900">{pkg.duration_formatted}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Features Included
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm">
                      <Signal className="h-4 w-4 text-gray-500" />
                      {pkg.network_type}
                    </span>
                    {pkg.has_voice && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                        <Phone className="h-4 w-4" />
                        {pkg.voice_formatted || 'Voice Calls'}
                      </span>
                    )}
                    {pkg.has_sms && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm">
                        <MessageSquare className="h-4 w-4" />
                        {pkg.sms_formatted || 'SMS'}
                      </span>
                    )}
                    {pkg.has_roaming && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm">
                        <MapPin className="h-4 w-4" />
                        Roaming ({pkg.roaming_countries?.length || 0} countries)
                      </span>
                    )}
                  </div>
                </div>

                {/* What's Included */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    What You Get
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Instant delivery via QR code',
                      'Works on eSIM compatible devices',
                      'No physical SIM card needed',
                      'Keep your existing number active',
                      'Easy online activation',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Package ({pkg.data_formatted})</span>
                  <span className="font-medium">₦{pkg.selling_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Validity</span>
                  <span className="font-medium">{pkg.duration_formatted}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-500">
                    ₦{pkg.selling_price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className={`rounded-xl p-4 mb-6 ${canAfford ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${canAfford ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Wallet className={`h-5 w-5 ${canAfford ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Your Balance</p>
                    <p className={`font-bold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
                      ₦{user?.balance.toLocaleString() || '0'}
                    </p>
                  </div>
                  {!canAfford && (
                    <button
                      onClick={() => navigate('/wallet')}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Top Up
                    </button>
                  )}
                </div>
                {!canAfford && (
                  <p className="text-xs text-red-600 mt-2">
                    You need ₦{(pkg.selling_price - (user?.balance || 0)).toLocaleString()} more
                  </p>
                )}
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={purchasing || !canAfford}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  purchasing || !canAfford
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg'
                }`}
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : !canAfford ? (
                  'Insufficient Balance'
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Purchase Now
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure payment from wallet</span>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
              <h4 className="font-semibold text-primary-900 mb-2 text-sm">Instant Delivery</h4>
              <p className="text-xs text-primary-700">
                Your eSIM QR code will be available immediately after purchase.
                No shipping, no waiting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
