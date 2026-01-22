import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/stores/AuthContext';
import { getErrorMessage } from '@/services';
import { LoginForm } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      // Check if this is an email verification error
      if (errorMessage.toLowerCase().includes('verify your email')) {
        toast.info('Please verify your email to continue.');
        navigate('/verify-email-pending', { state: { email: data.email } });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Sign in to your account
      </h2>

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

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};
