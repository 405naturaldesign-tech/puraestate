'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Home, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(token, data.password);
      router.push('/auth/login?reset=success');
    } catch {
      setError('root', { message: 'Invalid or expired reset link. Please try again.' });
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-500">Invalid reset link.</p>
          <Link href="/auth/forgot-password" className="mt-4 text-primary-600 underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Home className="h-5 w-5" />
          </div>
          <span className="gradient-text text-xl">PuraEstate</span>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-card dark:bg-neutral-900">
          <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
            Create new password
          </h1>
          <p className="mb-6 text-neutral-500 dark:text-neutral-400">
            Your new password must be different from your previous password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">
                {errors.root.message}
              </div>
            )}

            <Input
              label="New Password"
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
              error={errors.confirm_password?.message}
              required
              {...register('confirm_password')}
            />

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Resetting...">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
