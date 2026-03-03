import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, apiKeyOrProtectedProcedure } from '../trpc';
import { flaskGateway } from '../lib/flask-gateway';
import { composio } from '../lib/composio';

const InquiryCreateSchema = z.object({
  propertyId: z.string(),
  inquiryType: z.enum(['general', 'viewing', 'offer']),
  message: z.string().optional(),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  buyerPhone: z.string().optional(),
});

const InquiryUpdateSchema = z.object({
  status: z.enum(['pending', 'responded', 'scheduled', 'closed']).optional(),
  message: z.string().optional(),
  viewingDate: z.string().optional(),
  offerPrice: z.number().optional(),
});

export const inquiriesRouter = router({
  /**
   * Get user's inquiries
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const inquiries = await flaskGateway.getInquiries(token, {
          status: input.status,
          limit: input.limit,
        });
        return inquiries;
      } catch (error) {
        throw new Error(`Failed to fetch inquiries: ${error}`);
      }
    }),

  /**
   * Create inquiry
   */
  create: publicProcedure
    .input(InquiryCreateSchema)
    .mutation(async ({ input }) => {
      try {
        const inquiry = await flaskGateway.createInquiry(
          {
            property_id: input.propertyId,
            inquiry_type: input.inquiryType,
            message: input.message,
            buyer_name: input.buyerName,
            buyer_email: input.buyerEmail,
            buyer_phone: input.buyerPhone,
          },
          '' // Public inquiry (no auth token)
        );

        // Send WhatsApp notification to agent (Costa Rica optimization)
        if (input.buyerPhone) {
          const notificationMessage = `
🏠 New Inquiry
Type: ${input.inquiryType}
From: ${input.buyerName || 'Anonymous'}
Phone: ${input.buyerPhone}
${input.message ? `Message: ${input.message}` : ''}
          `.trim();

          // This would be sent to the property agent's WhatsApp
          // In production, get agent phone from listing
          console.log('[Inquiries] Inquiry created:', inquiry);
        }

        return inquiry;
      } catch (error) {
        throw new Error(`Failed to create inquiry: ${error}`);
      }
    }),

  /**
   * Update inquiry status
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: InquiryUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const updated = await flaskGateway.updateInquiry(
          input.id,
          input.data,
          token
        );

        // Send WhatsApp notification if status changed
        if (input.data.status === 'scheduled' && input.data.viewingDate) {
          console.log(`[Inquiries] Viewing scheduled for ${input.data.viewingDate}`);
          // Would send reminder message
        }

        return updated;
      } catch (error) {
        throw new Error(`Failed to update inquiry: ${error}`);
      }
    }),

  /**
   * Send WhatsApp message to inquiry party
   * Supports both JWT authentication and API key authentication
   */
  sendWhatsAppMessage: apiKeyOrProtectedProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        phoneNumber: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await composio.sendWhatsAppMessage(
          input.phoneNumber,
          input.message
        );

        if (result.success) {
          // Log in composio_events table (via Flask)
          console.log(`[Inquiries] WhatsApp sent to ${input.phoneNumber}`);
        }

        return result;
      } catch (error) {
        throw new Error(`Failed to send WhatsApp: ${error}`);
      }
    }),

  /**
   * Schedule viewing
   */
  scheduleViewing: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        viewingDate: z.string(), // ISO 8601
        buyerEmail: z.string().email(),
        agentEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        // Create calendar event via Composio
        const calendarResult = await composio.createCalendarEvent(
          'Property Viewing',
          input.viewingDate,
          new Date(new Date(input.viewingDate).getTime() + 60 * 60000).toISOString(), // +1 hour
          [input.buyerEmail, input.agentEmail]
        );

        // Update inquiry status
        const inquiryResult = await flaskGateway.updateInquiry(
          input.inquiryId,
          {
            status: 'scheduled',
            viewing_date: input.viewingDate,
          },
          ctx.req.headers.authorization?.replace('Bearer ', '') || ''
        );

        return {
          success: calendarResult.success && inquiryResult.success,
          calendar: calendarResult,
          inquiry: inquiryResult,
        };
      } catch (error) {
        throw new Error(`Failed to schedule viewing: ${error}`);
      }
    }),

  /**
   * Send viewing reminder (24 hours before)
   */
  sendViewingReminder: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        phoneNumber: z.string(),
        propertyTitle: z.string(),
        viewingTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const result = await composio.sendViewingReminder(
          input.phoneNumber,
          input.propertyTitle,
          input.viewingTime
        );

        return result;
      } catch (error) {
        throw new Error(`Failed to send reminder: ${error}`);
      }
    }),

  /**
   * Submit offer
   */
  submitOffer: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        offerPrice: z.number().positive(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        const updated = await flaskGateway.updateInquiry(
          input.inquiryId,
          {
            status: 'negotiating',
            offer_price: input.offerPrice,
            message: input.message,
          },
          token
        );

        console.log(`[Inquiries] Offer submitted: $${input.offerPrice}`);
        return updated;
      } catch (error) {
        throw new Error(`Failed to submit offer: ${error}`);
      }
    }),
});
