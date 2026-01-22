import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { walletService, getErrorMessage } from '@/services';
import { useAuth } from '@/stores/AuthContext';

export const WalletSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      if (!txRef) {
        setStatus('error');
        setMessage('Invalid payment reference');
        return;
      }

      try {
        const response = await walletService.verifyPayment(txRef);
        if (response.success) {
          setStatus('success');
          setAmount(response.data.amount);
          await refreshUser();
        } else {
          setStatus('error');
          setMessage('Payment verification failed');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-error-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-x-4">
            <Link to="/wallet" className="btn-primary">
              Try Again
            </Link>
            <Link to="/dashboard" className="btn-outline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-secondary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-2">
          ₦{amount.toLocaleString()} has been added to your wallet.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can now purchase phone numbers and SMM services.
        </p>
        <div className="space-x-4">
          <Link to="/phone-numbers" className="btn-primary">
            Buy Phone Number
          </Link>
          <Link to="/dashboard" className="btn-outline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
