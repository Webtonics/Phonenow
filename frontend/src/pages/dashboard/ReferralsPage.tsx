import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Copy,
  Share2,
  CheckCircle,
  Loader2,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { referralService, type ReferralDashboard } from '@/services/referral.service';

export const ReferralsPage = () => {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await referralService.getDashboard();
      if (response.success) {
        setDashboard(response.data);
      }
    } catch (error) {
      toast.error('Failed to load referral dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type === 'code' ? 'Referral code' : 'Referral link'} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!dashboard) return;
    const message = `Join PhoneNow and get ₦500 bonus! Use my referral code: ${dashboard.referral_code}\n\n${dashboard.referral_link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTwitter = () => {
    if (!dashboard) return;
    const message = `Get instant SMS verification numbers + ₦500 signup bonus! Use my code: ${dashboard.referral_code}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(dashboard.referral_link)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load referral dashboard</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Referrals',
      value: dashboard.stats.total_referrals,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Referrals',
      value: dashboard.stats.active_referrals,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Earned',
      value: `₦${dashboard.stats.total_earned.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      label: 'Pending Earnings',
      value: `₦${dashboard.stats.pending_earnings.toLocaleString()}`,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Referral Program</h1>
        <p className="text-sm sm:text-base text-gray-600">Earn ₦ by referring friends to PhoneNow</p>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-primary-200 rounded-lg">
            <Gift className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary-900 mb-1">How It Works</h2>
            <p className="text-sm text-primary-700">Share your referral code and earn commission on every purchase</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <h3 className="font-semibold text-sm text-gray-900">Share Code</h3>
            </div>
            <p className="text-xs text-gray-600">Share your unique referral code with friends</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="font-semibold text-sm text-gray-900">They Get ₦500</h3>
            </div>
            <p className="text-xs text-gray-600">New users get ₦500 signup bonus</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <h3 className="font-semibold text-sm text-gray-900">You Earn 10%</h3>
            </div>
            <p className="text-xs text-gray-600">Get 10% commission on first 3 purchases, 5% after</p>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-2 border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h2>

        <div className="space-y-4">
          {/* Code Display */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Referral Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg px-4 py-3">
                <p className="font-mono text-xl sm:text-2xl font-bold text-primary-900 tracking-wider text-center">
                  {dashboard.referral_code}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(dashboard.referral_code, 'code')}
                className="p-3 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                title="Copy code"
              >
                {copied === 'code' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-primary-600" />
                )}
              </button>
            </div>
          </div>

          {/* Link Display */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Referral Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-gray-700 truncate">{dashboard.referral_link}</p>
              </div>
              <button
                onClick={() => copyToClipboard(dashboard.referral_link, 'link')}
                className="p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy link"
              >
                {copied === 'link' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="pt-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Share via</label>
            <div className="flex gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={shareViaTwitter}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Twitter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bgColor} rounded-xl p-4 border-2 border-gray-200`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${stat.color} rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link
          to="/referrals/list"
          className="card hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  View Referrals
                </h3>
                <p className="text-sm text-gray-500">See all your referred users</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>

        <Link
          to="/referrals/commissions"
          className="card hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Commission History
                </h3>
                <p className="text-sm text-gray-500">Track your earnings</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
};
