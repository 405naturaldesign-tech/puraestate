'use client';

import { useState } from 'react';

import { MessageCircle, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { propertiesApi } from '@/lib/api/properties';
import type { Property } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  viewing_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  property: Property;
}

export function ContactForm({ property }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: `Hi, I'm interested in this property: ${property.title}. Please contact me.`,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await propertiesApi.sendInquiry({ ...data, property_id: property.id });
      setSubmitted(true);
      toast.success('Message sent! The agent will contact you soon.');
      reset();
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Agent</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Agent info */}
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
          <Avatar name={property.agent?.full_name} size="md" />
          <div>
            <div className="font-medium text-neutral-900 dark:text-white">
              {property.agent?.full_name}
            </div>
            <div className="text-sm text-neutral-500">{property.agent?.agent_profile?.agency_name}</div>
          </div>
          <div className="ml-auto flex gap-2">
            {property.agent?.phone && (
              <Button variant="outline" size="icon-sm" asChild>
                <a href={`tel:${property.agent.phone}`} aria-label="Call agent">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="outline" size="icon-sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-xl bg-success-50 p-6 text-center dark:bg-success-900/20">
            <div className="mb-2 text-4xl">✓</div>
            <h3 className="font-semibold text-success-700 dark:text-success-400">
              Message Sent!
            </h3>
            <p className="mt-1 text-sm text-success-600 dark:text-success-500">
              The agent will get back to you within 24 hours.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSubmitted(false)}
            >
              Send Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Your Name"
              placeholder="John Doe"
              error={errors.name?.message}
              required
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              required
              {...register('email')}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('phone')}
            />
            <Input
              label="Preferred viewing date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register('viewing_date')}
            />
            <Textarea
              label="Message"
              rows={4}
              error={errors.message?.message}
              required
              {...register('message')}
            />
            <Button type="submit" fullWidth isLoading={isSubmitting} loadingText="Sending...">
              Send Message
            </Button>
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              By submitting, you agree to our{' '}
              <a href="/terms" className="underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
