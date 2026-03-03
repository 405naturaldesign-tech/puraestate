'use client';

import { useState } from 'react';

import { Save, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { adminApi } from '@/lib/api/admin';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.updateSettings(data),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  });

  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Platform Settings
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Site Name"
              defaultValue={settings?.site_name || 'PuraEstate'}
              onChange={(e) => handleChange('site_name', e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              defaultValue={settings?.contact_email || 'hello@puraestate.com'}
              onChange={(e) => handleChange('contact_email', e.target.value)}
            />
            <Input
              label="Properties Per Page"
              type="number"
              min="6"
              max="48"
              defaultValue={settings?.properties_per_page || '12'}
              onChange={(e) => handleChange('properties_per_page', e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-900 dark:text-white">
                  Auto-approve listings
                </div>
                <div className="text-sm text-neutral-500">
                  Skip manual review for verified agents
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked={settings?.auto_approve_listings}
                  className="peer sr-only"
                  onChange={(e) =>
                    handleChange('auto_approve_listings', String(e.target.checked))
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-neutral-700" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-900 dark:text-white">
                  Require email verification
                </div>
                <div className="text-sm text-neutral-500">
                  Users must verify email before listing
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked={settings?.require_email_verification ?? true}
                  className="peer sr-only"
                  onChange={(e) =>
                    handleChange('require_email_verification', String(e.target.checked))
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full dark:bg-neutral-700" />
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={mutation.isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
