import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { authService, getErrorMessage } from '@/services';

export const VerifyEmailPendingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  // Get email from location state or stored pending user
  const getEmail = (): string => {
    if (location.state?.email) {
      return location.state.email;
    }
    const pendingUser = localStorage.getItem('pending_user');
    if (pendingUser) {
      try {
        return JSON.parse(pendingUser).email || '';
      } catch {
        return '';
      }
    }
    return '';
  };

  const email = getEmail();

  // Check if user has a token to resend verification
  const hasToken = !!authService.getToken();

  // Redirect to login if no email and no token
  useEffect(() => {
    if (!email && !hasToken) {
      navigate('/login');
    }
  }, [email, hasToken, navigate]);

  const handleResendVerification = async () => {
    if (!hasToken) {
      toast.error('Session expired. Please try logging in again to resend verification email.');
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-primary-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Verify your email
      </h2>

      <p className="text-gray-600 mb-2">
        We've sent a verification email to:
      </p>

      {email && (
        <p className="font-medium text-gray-900 mb-6">
          {email}
        </p>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-gray-600 mb-3">
          Please check your inbox and click the verification link to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          If you don't see the email, check your spam folder or click below to resend.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleResendVerification}
          disabled={isResending || !hasToken}
          className="btn-outline w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Resend verification email
            </>
          )}
        </button>

        <Link
          to="/login"
          className="btn-primary w-full py-3 block"
        >
          Go to Login
        </Link>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Wrong email?{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Register again
        </Link>
      </p>
    </div>
  );
};
