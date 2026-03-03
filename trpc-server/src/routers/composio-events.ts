import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { flaskGateway } from '../lib/flask-gateway';

/**
 * Log automation events (WhatsApp sent, email, calendar events)
 * Used for tracking, debugging, and analytics
 */

const ComposioEventCreateSchema = z.object({
  inquiryId: z.string().optional(),
  eventType: z.enum([
    'whatsapp_sent',
    'whatsapp_received',
    'email_sent',
    'email_received',
    'calendar_event_created',
    'calendar_reminder_sent',
    'invoice_generated',
    'offer_submitted',
    'viewing_scheduled',
    'dispute_initiated',
    'ai_match_completed',
  ]),
  status: z.enum(['pending', 'success', 'failed']).default('pending'),
  payload: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

export const composioEventsRouter = router({
  /**
   * Get event log for inquiry
   */
  list: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string().optional(),
        eventType: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        // This would be a Flask endpoint like /api/composio-events
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events?` +
            new URLSearchParams({
              inquiry_id: input.inquiryId || '',
              event_type: input.eventType || '',
              limit: String(input.limit),
              offset: String(input.offset),
            }),
          {
            headers: {
              'Authorization': ctx.req.headers.authorization || '',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to fetch event log: ${error}`);
      }
    }),

  /**
   * Log automation event
   */
  create: protectedProcedure
    .input(ComposioEventCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const response = await fetch(`${process.env.FLASK_API_URL}/api/composio-events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inquiry_id: input.inquiryId,
            event_type: input.eventType,
            status: input.status,
            payload: input.payload,
            error: input.error,
            created_at: new Date().toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Failed to log event');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to create event: ${error}`);
      }
    }),

  /**
   * Get analytics dashboard
   */
  analytics: adminProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events/analytics?` +
            new URLSearchParams({
              date_from: input.dateFrom || '',
              date_to: input.dateTo || '',
            }),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch analytics');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to fetch analytics: ${error}`);
      }
    }),

  /**
   * Get WhatsApp delivery status
   */
  whatsappStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events/${input.eventId}/whatsapp-status`,
          {
            headers: {
              'Authorization': ctx.req.headers.authorization || '',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch status');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to fetch WhatsApp status: ${error}`);
      }
    }),

  /**
   * Get email delivery status
   */
  emailStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events/${input.eventId}/email-status`,
          {
            headers: {
              'Authorization': ctx.req.headers.authorization || '',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch status');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to fetch email status: ${error}`);
      }
    }),

  /**
   * Retry failed event
   */
  retry: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events/${input.eventId}/retry`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to retry');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to retry event: ${error}`);
      }
    }),

  /**
   * Get event details
   */
  byId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: eventId }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const response = await fetch(
          `${process.env.FLASK_API_URL}/api/composio-events/${eventId}`,
          {
            headers: {
              'Authorization': ctx.req.headers.authorization || '',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch event');
        return await response.json();
      } catch (error) {
        throw new Error(`Failed to fetch event: ${error}`);
      }
    }),
});
