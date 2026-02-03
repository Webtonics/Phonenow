import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { walletService, getErrorMessage } from '@/services';
import { useAuth } from '@/stores/AuthContext';
import { toast } from 'sonner';

export const WalletSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const flwStatus = searchParams.get('status');

      if (!txRef) {
        setStatus('error');
        setMessage('Invalid payment reference. Please contact support if you were charged.');
        return;
      }

      // Check Flutterwave status from URL params first
      if (flwStatus === 'cancelled') {
        setStatus('error');
        setMessage('You cancelled the payment.');
        return;
      }

      try {
        const response = await walletService.verifyPayment(txRef, transactionId || undefined);
        if (response.data?.status === 'completed') {
          setStatus('success');
          setAmount(response.data.amount);
          setBalance(response.data.balance);
          await refreshUser();
          toast.success(`₦${response.data.amount.toLocaleString()} added to your wallet!`);
        } else {
          setStatus('error');
          setMessage(response.message || 'Payment verification failed. Please contact support if you were charged.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(getErrorMessage(error));
      }
    };

    verifyPayment();
  }, [searchParams, refreshUser]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-sm sm:text-base text-gray-600">Please wait while we confirm your payment with Flutterwave</p>
          <p className="text-xs text-gray-500 mt-4">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Payment Failed
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/wallet" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3">
              <Wallet className="w-5 h-5" />
              Try Again
            </Link>
            <Link to="/dashboard" className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-md w-full">
        {/* Success Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-green-400 rounded-full opacity-20 animate-ping"></div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Payment Successful!
        </h2>

        {/* Amount Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-6">
          <p className="text-sm text-gray-600 mb-2">Amount Added</p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-3">
            ₦{amount.toLocaleString()}
          </p>
          <div className="pt-4 border-t border-green-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">New Wallet Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              ₦{balance.toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-6 px-4">
          Your wallet has been credited successfully. You can now purchase phone numbers and eSIM packages.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/phone-numbers"
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base"
          >
            Buy Phone Number
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/wallet"
            className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base"
          >
            <Wallet className="w-4 h-4" />
            View Wallet
          </Link>
        </div>
      </div>
    </div>
  );
};
