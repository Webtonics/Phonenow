import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/AuthContext';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { walletService, getErrorMessage } from '@/services';
import type { Transaction, PaymentMethod } from '@/types';

const gatewayDisplay: Record<string, { label: string; subtitle: string }> = {
  flutterwave: { label: 'Express Pay', subtitle: 'Cards, Bank Transfer & USSD' },
  korapay: { label: 'Secure Pay', subtitle: 'Cards, Bank Transfer & USSD' },
  cryptomus: { label: 'Crypto Pay', subtitle: 'Bitcoin, USDT & more' },
};

export const WalletPage = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [paymentProvider, setPaymentProvider] = useState<'flutterwave' | 'cryptomus' | 'korapay'>('flutterwave');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const fetchTransactions = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoadingTransactions(true);
      }

      const params: any = { per_page: 50 };
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await walletService.getTransactions(params);
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingTransactions(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await walletService.getPaymentMethods();
      if (response.success && response.data) {
        setPaymentMethods(response.data);
        if (response.data.length > 0) {
          setPaymentProvider(response.data[0].id as 'flutterwave' | 'cryptomus' | 'korapay');
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleFundWallet = async () => {
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      toast.error('Minimum amount is ₦1,000');
      return;
    }
    if (amountNum > 1000000) {
      toast.error('Maximum amount is ₦1,000,000');
      return;
    }

    setIsLoading(true);
    try {
      const response = await walletService.fundWallet(amountNum, paymentProvider);
      if (response.data?.link) {
        window.location.href = response.data.link;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
      completed: {
        label: 'Completed',
        icon: <CheckCircle className="w-3 h-3" />,
        bg: 'bg-green-50',
        text: 'text-green-700',
      },
      pending: {
        label: 'Pending',
        icon: <Clock className="w-3 h-3" />,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
      },
      failed: {
        label: 'Failed',
        icon: <XCircle className="w-3 h-3" />,
        bg: 'bg-red-50',
        text: 'text-red-700',
      },
      expired: {
        label: 'Expired',
        icon: <XCircle className="w-3 h-3" />,
        bg: 'bg-gray-50',
        text: 'text-gray-500',
      },
      cancelled: {
        label: 'Cancelled',
        icon: <XCircle className="w-3 h-3" />,
        bg: 'bg-gray-50',
        text: 'text-gray-500',
      },
    };
    const s = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {s.label}
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

  const getGatewayIcon = (methodId: string, isSelected: boolean) => {
    const cls = `w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`;
    switch (methodId) {
      case 'flutterwave':
        return <Zap className={cls} />;
      case 'korapay':
        return <ShieldCheck className={cls} />;
      case 'cryptomus':
        return <span className={`text-sm leading-none ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}>&#8383;</span>;
      default:
        return <CreditCard className={cls} />;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 px-1 sm:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your funds & transactions</p>
        </div>
        <button
          onClick={() => fetchTransactions(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 rounded-2xl p-5 sm:p-7 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 -left-14 w-44 h-44 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm font-medium text-white/75">Available Balance</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-3xl sm:text-4xl font-bold tracking-tight">
            {showBalance ? `₦${user?.balance?.toLocaleString() || '0.00'}` : '₦ • • • • •'}
          </p>
          <p className="text-[11px] sm:text-xs text-white/50 mt-1.5 font-medium">Nigerian Naira (NGN)</p>
        </div>
      </div>

      {/* Fund Wallet Card */}
      <div className="card !p-5 sm:!p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Plus className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Funds</h2>
            <p className="text-xs text-gray-400">Choose payment method and enter amount</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Payment Methods */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 block">
              Payment Method
            </label>
            {loadingMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                No payment methods available
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentMethods.map((method) => {
                  const display = gatewayDisplay[method.id];
                  const isSelected = paymentProvider === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentProvider(method.id as 'flutterwave' | 'cryptomus' | 'korapay')}
                      className={`w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50'
                          : 'border-gray-150 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Radio dot */}
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-primary-500' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                      </div>

                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-primary-100' : 'bg-gray-100'
                        }`}
                      >
                        {getGatewayIcon(method.id, isSelected)}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                          {display?.label || method.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                          {display?.subtitle || method.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Amount Input */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300 pointer-events-none select-none">
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="input !text-2xl sm:!text-3xl font-bold !pl-10 !pr-4 !py-4 sm:!py-5 rounded-xl bg-gray-50 border-gray-200 focus:bg-white placeholder:text-gray-200"
                min={1000}
                max={1000000}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Min ₦1,000 &middot; Max ₦1,000,000
            </p>
          </div>

          {/* Quick Amounts */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Quick Select
            </p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    amount === amt.toString()
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Fund Button */}
          <button
            onClick={handleFundWallet}
            disabled={isLoading || !amount || paymentMethods.length === 0}
            className="btn-primary w-full !py-3.5 sm:!py-4 text-sm font-semibold !rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Fund Wallet{amount ? ` — ₦${parseInt(amount).toLocaleString()}` : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card !p-5 sm:!p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-semibold text-gray-900">Transactions</h2>

          {/* Segmented filter */}
          <div className="flex gap-0.5 p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'credit', label: 'Money In' },
              { value: 'debit', label: 'Money Out' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingTransactions ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
            <p className="text-xs text-gray-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-xl flex-shrink-0 ${
                    tx.type === 'credit' ? 'bg-green-50 group-hover:bg-green-100' : 'bg-red-50 group-hover:bg-red-100'
                  } transition-colors`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description || (tx.type === 'credit' ? 'Wallet Funded' : 'Purchase')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-gray-400">{formatDate(tx.created_at)}</span>
                    {tx.payment_method && (
                      <>
                        <span className="text-gray-200">&middot;</span>
                        <span className="text-[11px] text-gray-400 capitalize">
                          {gatewayDisplay[tx.payment_method]?.label || tx.payment_method}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount + Status */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p
                    className={`text-sm font-bold ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
