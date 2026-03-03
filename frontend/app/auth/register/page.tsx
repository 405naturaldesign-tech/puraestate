'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Home, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/lib/hooks/useAuth';

const schema = z
  .object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.enum(['buyer', 'seller', 'agent']),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ['password_confirm'],
  });

type FormData = z.infer<typeof schema>;

const roleOptions = [
  { value: 'buyer', label: 'Buyer — Looking to buy or rent' },
  { value: 'seller', label: 'Seller — Listing a property' },
  { value: 'agent', label: 'Agent — Real estate professional' },
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'buyer' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      setError('root', {
        message: apiError?.message || 'Registration failed. Please try again.',
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Form Panel */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            <span className="gradient-text text-xl">PuraEstate</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-neutral-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Join thousands of property seekers and sellers
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {errors.root && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-900/20 dark:text-danger-400">
                {errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.first_name?.message}
                required
                {...register('first_name')}
              />
              <Input
                label="Last Name"
                error={errors.last_name?.message}
                required
                {...register('last_name')}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <Input
              label="Phone (optional)"
              type="tel"
              leftIcon={<Phone className="h-4 w-4" />}
              {...register('phone')}
            />

            <Select
              label="I am a..."
              options={roleOptions}
              error={errors.role?.message}
              required
              {...register('role')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              hint="Min. 8 chars, 1 uppercase, 1 number"
              required
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password_confirm?.message}
              required
              {...register('password_confirm')}
            />

            <div>
              <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input type="checkbox" className="mt-0.5 rounded border-neutral-300 text-primary-600" required />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Creating account...">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Visual */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
          <div className="absolute inset-0 bg-hero-pattern opacity-20" />
          <div className="flex h-full flex-col items-center justify-center p-12 text-white">
            <div className="max-w-md text-center">
              <h2 className="text-4xl font-bold">Start Your Journey</h2>
              <p className="mt-4 text-lg text-primary-300">
                Free to join. Browse thousands of listings, save your favorites, and connect with
                expert agents.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { value: '50K+', label: 'Listings' },
                  { value: '12K+', label: 'Agents' },
                  { value: '100K+', label: 'Happy Users' },
                  { value: '$4B+', label: 'Transactions' },
                ].map(({ value, label }) => (
                  <div key={label} className="rounded-xl bg-white/10 p-4">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-primary-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
