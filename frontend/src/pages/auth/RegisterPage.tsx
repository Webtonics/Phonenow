import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Gift, Users } from 'lucide-react';
import { useAuth } from '@/stores/AuthContext';
import { getErrorMessage } from '@/services';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(20, 'Phone number must be less than 20 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    password_confirmation: z.string(),
    ref: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Check for referral code in URL
  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) {
      setReferralCode(refFromUrl);
      setValue('ref', refFromUrl);
    }
  }, [searchParams, setValue]);

  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        ref: data.ref,
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/verify-email-pending', { state: { email: data.email } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create your account
        </h2>
        <p className="text-gray-600">
          Join thousands of users worldwide
        </p>
      </div>

      {/* Referral Bonus Banner */}
      {referralCode && (
        <div className="mb-6 bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-900 mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1.5" />
                Referral Bonus Applied!
              </h3>
              <p className="text-sm text-secondary-700">
                You'll receive <span className="font-bold">₦500 signup bonus</span> after verifying your email.
                Your friend earns <span className="font-bold">10% commission</span> on your first 3 purchases!
              </p>
              <p className="text-xs text-secondary-600 mt-2">
                Referral Code: <span className="font-mono font-semibold">{referralCode}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-error-600 flex items-center">
              <XCircle className="w-4 h-4 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <p className="mt-1.5 text-sm text-error-600 flex items-center">
              <XCircle className="w-4 h-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`input ${errors.phone ? 'input-error' : ''}`}
            placeholder="+234 800 000 0000"
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-error-600 flex items-center">
              <XCircle className="w-4 h-4 mr-1" />
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={`input ${errors.password ? 'input-error' : ''}`}
              style={{ paddingRight: '2.5rem' }}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {password && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-600 mb-2">Password strength:</p>
              <div className="space-y-1.5">
                {passwordChecks.map((check, index) => (
                  <div key={index} className="flex items-center text-xs">
                    {check.valid ? (
                      <CheckCircle className="w-4 h-4 text-secondary-500 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mr-2" />
                    )}
                    <span
                      className={check.valid ? 'text-secondary-700 font-medium' : 'text-gray-500'}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="password_confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('password_confirmation')}
              className={`input ${errors.password_confirmation ? 'input-error' : ''
                }`}
              style={{ paddingRight: '2.5rem' }}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="mt-1.5 text-sm text-error-600 flex items-center">
              <XCircle className="w-4 h-4 mr-1" />
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* Manual Referral Code Input (if not from URL) */}
        {!referralCode && (
          <div>
            <label htmlFor="ref" className="block text-sm font-medium text-gray-700 mb-1.5">
              Referral Code <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              id="ref"
              type="text"
              {...register('ref')}
              className="input"
              placeholder="Enter referral code to get ₦500 bonus"
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Have a referral code? Enter it to receive a ₦500 signup bonus!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Already have an account?</span>
          </div>
        </div>

        <Link
          to="/login"
          className="block w-full text-center py-3 px-4 border-2 border-primary-600 rounded-lg font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
        >
          Sign in
        </Link>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};
