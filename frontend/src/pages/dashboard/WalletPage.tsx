import { useState } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { walletService, getErrorMessage } from '@/services';

export const WalletPage = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFundWallet = async () => {
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 500) {
      toast.error('Minimum amount is ₦500');
      return;
    }
    if (amountNum > 500000) {
      toast.error('Maximum amount is ₦500,000');
      return;
    }

    setIsLoading(true);
    try {
      const response = await walletService.fundWallet(amountNum);
      if (response.success && response.data.link) {
        window.location.href = response.data.link;
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center mb-2">
          <Wallet className="w-6 h-6 mr-2" />
          <span className="text-sm opacity-80">Available Balance</span>
        </div>
        <p className="text-4xl font-bold">
          ₦{user?.balance?.toLocaleString() || '0.00'}
        </p>
      </div>

      {/* Fund Wallet */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-primary-500" />
          Add Funds
        </h2>

        <div className="space-y-4">
          <div>
            <label className="label">Enter Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min ₦500)"
              className="input"
              min={500}
              max={500000}
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Quick amounts:</p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    amount === amt.toString()
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
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
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Fund Wallet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction History
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No transactions yet</p>
          <p className="text-sm">Your transactions will appear here</p>
        </div>
      </div>
    </div>
  );
};
