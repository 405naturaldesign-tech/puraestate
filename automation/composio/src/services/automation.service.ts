import messageService from './message.service';
import { PropertyMatchRequest, BookingRequest } from '../types';
import { PropertyModel, ViewingModel, InvestorModel, AgentModel } from '../db/schemas';
import queueManager from '../queue/manager';
import { getTemplate, interpolateTemplate } from '../templates';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';

export class AutomationService {
  /**
   * Workflow 1: Property Match Notification
   */
  async notifyPropertyMatch(request: PropertyMatchRequest): Promise<void> {
    try {
      const investor = await InvestorModel.findOne({ id: request.investorId });
      if (!investor) {
        throw new Error('Investor not found');
      }

      const properties = await PropertyModel.find({
        id: { $in: request.propertyIds },
      });

      logger.info('Processing property matches', {
        investorId: request.investorId,
        propertyCount: properties.length,
      });

      // Get top 3 agents for each property
      for (const property of properties) {
        const agents = await AgentModel.find({ agencyId: { $exists: true } })
          .limit(request.topAgentsCount || 3);

        for (const agent of agents) {
          if (!agent.whatsappOptIn) continue;

          // Get template
          const template = getTemplate('property_match', investor.preferences.language);
          if (!template) continue;

          // Prepare variables
          const variables = {
            investor_name: investor.firstName,
            property_title: property.title,
            property_location: `${property.location.city}, ${property.location.state}`,
            property_price: property.price.toLocaleString(),
            property_bedrooms: property.details.bedrooms.toString(),
            property_bathrooms: property.details.bathrooms.toString(),
            property_area: property.details.area.toString(),
            property_description: property.description.substring(0, 100),
            agent_name: agent.firstName,
            agent_phone: agent.phoneNumber,
            property_link: `${process.env.WEBHOOK_URL}/properties/${property.id}`,
          };

          // Send message
          const message = interpolateTemplate(template, variables);
          await messageService.sendMessage({
            phoneNumber: agent.phoneNumber,
            message,
          });

          logger.info('Property match notification sent', {
            agentId: agent.id,
            propertyId: property.id,
          });
        }
      }
    } catch (error) {
      logger.error('Property match notification failed', { error, request });
      throw error;
    }
  }

  /**
   * Workflow 2: Booking Confirmation
   */
  async sendBookingConfirmation(request: BookingRequest): Promise<void> {
    try {
      const investor = await InvestorModel.findOne({ id: request.investorId });
      const agent = await AgentModel.findOne({ id: request.agentId });
      const property = await PropertyModel.findOne({ id: request.propertyId });

      if (!investor || !agent || !property) {
        throw new Error('Required data not found');
      }

      // Create viewing
      const viewing = new ViewingModel({
        id: uuidv4(),
        propertyId: request.propertyId,
        investorId: request.investorId,
        agentId: request.agentId,
        scheduledDate: request.preferredDate,
        duration: 30,
        status: 'confirmed',
        notes: request.notes,
      });

      await viewing.save();

      // Send to investor
      if (investor.whatsappOptIn) {
        const investorTemplate = getTemplate('booking_confirmation', investor.preferences.language);
        if (investorTemplate) {
          const investorVars = {
            investor_name: investor.firstName,
            property_title: property.title,
            property_address: property.location.address,
            viewing_date: request.preferredDate.toLocaleDateString(),
            viewing_time: request.preferredDate.toLocaleTimeString(),
            viewing_duration: '30',
            agent_name: agent.firstName,
            agent_phone: agent.phoneNumber,
            agent_email: agent.email,
            calendar_link: `${process.env.WEBHOOK_URL}/viewings/${viewing.id}/calendar`,
          };

          const message = interpolateTemplate(investorTemplate, investorVars);
          await messageService.sendMessage({
            phoneNumber: investor.phoneNumber,
            message,
          });
        }
      }

      // Send to agent
      if (agent.whatsappOptIn) {
        const agentTemplate = getTemplate('booking_confirmation', agent.language);
        if (agentTemplate) {
          const agentVars = {
            investor_name: investor.firstName,
            property_title: property.title,
            property_address: property.location.address,
            viewing_date: request.preferredDate.toLocaleDateString(),
            viewing_time: request.preferredDate.toLocaleTimeString(),
            viewing_duration: '30',
            agent_name: agent.firstName,
            agent_phone: investor.phoneNumber,
            agent_email: investor.email,
            calendar_link: `${process.env.WEBHOOK_URL}/viewings/${viewing.id}/calendar`,
          };

          const message = interpolateTemplate(agentTemplate, agentVars);
          await messageService.sendMessage({
            phoneNumber: agent.phoneNumber,
            message,
          });
        }
      }

      // Schedule reminders
      await this.scheduleViewingReminders(viewing.id);

      logger.info('Booking confirmation sent', {
        viewingId: viewing.id,
        investorId: request.investorId,
        agentId: request.agentId,
      });
    } catch (error) {
      logger.error('Booking confirmation failed', { error, request });
      throw error;
    }
  }

  /**
   * Workflow 3: Schedule Viewing Reminders
   */
  async scheduleViewingReminders(viewingId: string): Promise<void> {
    try {
      const viewing = await ViewingModel.findOne({ id: viewingId });
      if (!viewing) {
        throw new Error('Viewing not found');
      }

      const investor = await InvestorModel.findOne({ id: viewing.investorId });
      if (!investor || !investor.whatsappOptIn) return;

      const property = await PropertyModel.findOne({ id: viewing.propertyId });
      const agent = await AgentModel.findOne({ id: viewing.agentId });

      if (!property || !agent) return;

      const now = new Date();
      const viewingTime = new Date(viewing.scheduledDate);

      // Schedule 24-hour reminder
      const delay24h = Math.max(0, viewingTime.getTime() - now.getTime() - 24 * 60 * 60 * 1000);
      if (delay24h > 0) {
        await queueManager.addReminderJob(
          {
            type: 'viewing_reminder_24h',
            viewingId,
            investorId: viewing.investorId,
            phoneNumber: investor.phoneNumber,
            language: investor.preferences.language,
            propertyTitle: property.title,
            propertyAddress: property.location.address,
            viewingTime: viewingTime.toLocaleTimeString(),
            viewingDuration: viewing.duration.toString(),
            agentPhone: agent.phoneNumber,
            retryCount: 0,
          },
          delay24h
        );
      }

      // Schedule 1-hour reminder
      const delay1h = Math.max(0, viewingTime.getTime() - now.getTime() - 60 * 60 * 1000);
      if (delay1h > 0) {
        await queueManager.addReminderJob(
          {
            type: 'viewing_reminder_1h',
            viewingId,
            investorId: viewing.investorId,
            phoneNumber: investor.phoneNumber,
            language: investor.preferences.language,
            propertyTitle: property.title,
            viewingTime: viewingTime.toLocaleTimeString(),
            retryCount: 0,
          },
          delay1h
        );
      }

      logger.info('Viewing reminders scheduled', { viewingId });
    } catch (error) {
      logger.error('Failed to schedule viewing reminders', { error, viewingId });
    }
  }

  /**
   * Workflow 4: Send Payment Notification
   */
  async sendPaymentNotification(
    investorId: string,
    type: 'confirmation' | 'failed',
    paymentData: Record<string, any>
  ): Promise<void> {
    try {
      const investor = await InvestorModel.findOne({ id: investorId });
      if (!investor || !investor.whatsappOptIn) return;

      const templateKey = type === 'confirmation' ? 'payment_confirmation' : 'payment_failed';
      const template = getTemplate(templateKey, investor.preferences.language);

      if (!template) return;

      const variables = {
        investor_name: investor.firstName,
        amount: paymentData.amount || '',
        currency: paymentData.currency || 'USD',
        payment_date: new Date().toLocaleDateString(),
        plan_name: paymentData.planName || '',
        transaction_id: paymentData.transactionId || '',
        invoice_link: paymentData.invoiceLink || '',
        app_link: `${process.env.WEBHOOK_URL}/dashboard`,
        failure_reason: paymentData.failureReason || '',
        payment_update_link: `${process.env.WEBHOOK_URL}/account/payment`,
        support_phone: '+1234567890',
      };

      const message = interpolateTemplate(template, variables);
      await messageService.sendMessage({
        phoneNumber: investor.phoneNumber,
        message,
      });

      logger.info('Payment notification sent', { investorId, type });
    } catch (error) {
      logger.error('Failed to send payment notification', { error, investorId });
    }
  }

  /**
   * Workflow 5: Send Portfolio Update
   */
  async sendPortfolioUpdate(
    investorId: string,
    updateType: 'price_alert' | 'new_property' | 'market_news',
    data: Record<string, any>
  ): Promise<void> {
    try {
      const investor = await InvestorModel.findOne({ id: investorId });
      if (!investor || !investor.whatsappOptIn) return;

      let templateKey: string;
      if (updateType === 'price_alert') {
        templateKey = 'price_alert';
      } else {
        return; // Other types can be implemented
      }

      const template = getTemplate(templateKey, investor.preferences.language);
      if (!template) return;

      const variables = {
        investor_name: investor.firstName,
        property_title: data.propertyTitle || '',
        property_location: data.propertyLocation || '',
        old_price: data.oldPrice || '',
        new_price: data.newPrice || '',
        savings: data.savings || '',
        discount_percent: data.discountPercent || '',
        property_link: data.propertyLink || '',
        contact_agent_link: data.contactAgentLink || '',
      };

      const message = interpolateTemplate(template, variables);
      await messageService.sendMessage({
        phoneNumber: investor.phoneNumber,
        message,
      });

      logger.info('Portfolio update sent', { investorId, updateType });
    } catch (error) {
      logger.error('Failed to send portfolio update', { error, investorId });
    }
  }

  /**
   * Send viewing survey
   */
  async sendViewingSurvey(viewingId: string): Promise<void> {
    try {
      const viewing = await ViewingModel.findOne({ id: viewingId });
      if (!viewing) return;

      const investor = await InvestorModel.findOne({ id: viewing.investorId });
      const property = await PropertyModel.findOne({ id: viewing.propertyId });

      if (!investor?.whatsappOptIn || !property) return;

      const template = getTemplate('survey_request', investor.preferences.language);
      if (!template) return;

      const variables = {
        investor_name: investor.firstName,
        property_title: property.title,
        survey_link: `${process.env.WEBHOOK_URL}/survey/${viewingId}`,
      };

      const message = interpolateTemplate(template, variables);
      await messageService.sendMessage({
        phoneNumber: investor.phoneNumber,
        message,
      });

      logger.info('Survey request sent', { viewingId });
    } catch (error) {
      logger.error('Failed to send viewing survey', { error, viewingId });
    }
  }
}

export default new AutomationService();
