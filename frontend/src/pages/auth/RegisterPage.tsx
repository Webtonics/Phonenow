import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

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
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      // Redirect to verification pending page with email
      navigate('/verify-email-pending', { state: { email: data.email } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Create your account
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="name" className="label">
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
            <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="phone" className="label">
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
            <p className="mt-1 text-sm text-error-500">{errors.phone.message}</p>
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
              {...register('password')}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Create a strong password"
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
          {password && (
            <div className="mt-2 space-y-1">
              {passwordChecks.map((check, index) => (
                <div key={index} className="flex items-center text-xs">
                  {check.valid ? (
                    <CheckCircle className="w-4 h-4 text-secondary-500 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 mr-1" />
                  )}
                  <span
                    className={check.valid ? 'text-secondary-600' : 'text-gray-400'}
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="label">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="password_confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('password_confirmation')}
              className={`input pr-10 ${
                errors.password_confirmation ? 'input-error' : ''
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="mt-1 text-sm text-error-500">
              {errors.password_confirmation.message}
            </p>
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
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};
