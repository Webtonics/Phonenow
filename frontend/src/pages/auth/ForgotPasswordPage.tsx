import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { authService, getErrorMessage } from '@/services';
import { ForgotPasswordForm } from '@/types';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data);
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-secondary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to your email address. Please check
          your inbox and follow the instructions.
        </p>
        <Link to="/login" className="btn-outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        Forgot your password?
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </Link>
      </p>
    </div>
  );
};
