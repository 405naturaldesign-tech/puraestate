'use client';

import { useState } from 'react';

import { Camera, Lock, Save, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { isSubmitting: isChangingPassword },
  } = useForm<{ current_password: string; new_password: string; confirm_password: string }>();

  const onSaveProfile = async (data: Record<string, string>) => {
    try {
      const updated = await authApi.updateProfile(data);
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onChangePassword = async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      toast.success('Password changed successfully');
      resetPassword();
    } catch {
      toast.error('Failed to change password. Check your current password.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setIsUploading(true);
    try {
      const { avatar_url } = await authApi.uploadAvatar(file);
      if (user) {
        setUser({ ...user, avatar_url });
      }
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ] as const;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar name={user?.full_name} src={user?.avatar_url} size="xl" />
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700"
            >
              {isUploading ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {user?.full_name}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="feature-chip capitalize text-xs">{user?.role}</span>
              {user?.is_verified && (
                <span className="feature-chip bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400 text-xs">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" {...register('first_name')} />
                  <Input label="Last Name" {...register('last_name')} />
                </div>
                <Input label="Email Address" type="email" {...register('email')} />
                <Input label="Phone" type="tel" {...register('phone')} />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!isDirty}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  {...registerPassword('current_password')}
                />
                <Input
                  label="New Password"
                  type="password"
                  required
                  hint="Min. 8 characters, 1 uppercase, 1 number"
                  {...registerPassword('new_password')}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  {...registerPassword('confirm_password')}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isChangingPassword}
                    leftIcon={<Lock className="h-4 w-4" />}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
