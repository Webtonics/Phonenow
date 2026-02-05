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
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { walletService, getErrorMessage } from '@/services';
import type { Transaction } from '@/types';

export const WalletPage = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

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

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

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
      const response = await walletService.fundWallet(amountNum);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200' },
    };
    const statusConfig = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
        {getStatusIcon(status)}
        {statusConfig.label}
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

  const handleClearPending = async () => {
    try {
      const response = await walletService.clearPending();
      if (response.success) {
        toast.success(response.message);
        fetchTransactions(true);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearPending}
            className="btn-secondary text-xs px-2 py-1"
            title="Clear pending transactions"
          >
            Clear Pending
          </button>
          <button
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-sm sm:text-base opacity-90">Available Balance</span>
          </div>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1">
            ₦{user?.balance?.toLocaleString() || '0.00'}
          </p>
          <p className="text-xs sm:text-sm text-primary-100">NGN - Nigerian Naira</p>
        </div>
      </div>

      {/* Fund Wallet */}
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          Add Funds
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min ₦1,000)"
              className="input text-base sm:text-lg"
              min={1000}
              max={1000000}
            />
          </div>

          <div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2">Quick amounts:</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${amount === amt.toString()
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:scale-105'
                    }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFundWallet}
            disabled={isLoading || !amount}
            className="btn-primary w-full py-3 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Fund Wallet with Flutterwave
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">Secure payment powered by Flutterwave</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Transaction History
          </h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 w-full sm:w-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'credit', label: 'Credit' },
              { value: 'debit', label: 'Debit' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filter === tab.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-gray-300" />
            <p className="text-sm sm:text-base font-medium">No transactions yet</p>
            <p className="text-xs sm:text-sm mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">
                        {tx.description || (tx.type === 'credit' ? 'Wallet Funded' : 'Purchase')}
                      </p>
                      <p className={`text-base font-bold flex-shrink-0 ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                        <span className="flex-shrink-0">{formatDate(tx.created_at)}</span>
                        {tx.payment_method && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="capitalize flex-shrink-0">{tx.payment_method}</span>
                          </>
                        )}
                      </div>
                      {getStatusBadge(tx.status)}
                    </div>
                    {tx.reference && (
                      <p className="text-xs text-gray-400 font-mono mt-1.5 truncate max-w-[200px] sm:max-w-none">{tx.reference}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
