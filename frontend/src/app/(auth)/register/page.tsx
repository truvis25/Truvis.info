'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  companyName: z.string().min(2, 'Company name required').max(255),
  email: z.string().email('Valid email required'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.register({
        companyName: data.companyName,
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-md text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We've sent a verification link to your email address. Please verify your email to activate your account.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            The link expires in 24 hours. Check your spam folder if you don't see it.
          </p>
          <Link href="/login" className="btn-primary w-full mt-6">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <span className="text-gold-500 font-bold">TV</span>
            </div>
            <span className="text-xl font-bold text-navy-900">TruVis<span className="text-gold-500">.info</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-navy-900 mt-6 mb-1">List Your Company</h1>
          <p className="text-gray-500 text-sm">Join the TruVis verified business ecosystem</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
              <input
                {...register('companyName')}
                className="input-field"
                placeholder="Your company name"
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@company.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min 8 chars, uppercase & number"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="input-field"
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? 'Creating Account...' : 'Create Account & List Company'}
            </button>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              By registering, you agree to our{' '}
              <Link href="/terms" className="text-navy-700 hover:underline">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-navy-700 hover:underline">Privacy Policy</Link>.
              Your profile requires admin approval before going live.
            </p>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-navy-700 font-medium hover:text-navy-900">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
