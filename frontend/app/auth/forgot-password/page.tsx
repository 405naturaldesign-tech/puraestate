'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Home, Mail } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await authApi.forgotPassword(data.email);
    setSubmitted(true);
  };

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
          {submitted ? (
            <div className="text-center">
              <div className="mb-4 text-5xl">📧</div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Check your email
              </h1>
              <p className="mt-3 text-neutral-500 dark:text-neutral-400">
                We sent a password reset link to{' '}
                <strong className="text-neutral-900 dark:text-white">{getValues('email')}</strong>
              </p>
              <Button className="mt-6" fullWidth variant="outline" asChild>
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
                Reset your password
              </h1>
              <p className="mb-6 text-neutral-500 dark:text-neutral-400">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />
                <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Sending...">
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
