import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { authService, getErrorMessage } from '@/services';

export const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid verification token');
        return;
      }

      try {
        await authService.verifyEmail(token);
        // Clear any pending user data since verification is complete
        localStorage.removeItem('pending_user');
        localStorage.removeItem('auth_token');
        setStatus('success');
      } catch (error) {
        const message = getErrorMessage(error);
        // Check if already verified
        if (message.toLowerCase().includes('already verified')) {
          setStatus('already_verified');
        } else {
          setStatus('error');
          setErrorMessage(message);
        }
      }
    };

    verifyEmail();
  }, [token]);

  // Check if error suggests requesting new link
  const showResendOption = errorMessage.toLowerCase().includes('expired') ||
                           errorMessage.toLowerCase().includes('already been used');

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verifying your email...
        </h2>
        <p className="text-gray-600">Please wait while we verify your email address.</p>
      </div>
    );
  }

  if (status === 'already_verified') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-secondary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Email Already Verified
        </h2>
        <p className="text-gray-600 mb-6">
          Your email has already been verified. You can log in to your account.
        </p>
        <Link to="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-error-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verification Failed
        </h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>

        <div className="space-y-3">
          {showResendOption && (
            <button
              onClick={() => navigate('/login')}
              className="btn-outline w-full py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Login to Request New Link
            </button>
          )}
          <Link to="/login" className="btn-primary w-full py-3 block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-secondary-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Email Verified!
      </h2>
      <p className="text-gray-600 mb-6">
        Your email has been verified successfully. You can now log in to your account.
      </p>
      <Link to="/login" className="btn-primary">
        Go to Login
      </Link>
    </div>
  );
};
