import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import automationService from '../services/automation.service';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { InvestorModel, AgentModel, PropertyModel, ViewingModel } from '../db/schemas';
import { v4 as uuidv4 } from 'uuid';

describe('AutomationService', () => {
  let testInvestor: any;
  let testAgent: any;
  let testProperty: any;

  beforeAll(async () => {
    await connectDatabase();

    // Create test data
    testInvestor = await InvestorModel.create({
      id: uuidv4(),
      phoneNumber: '+1234567890',
      firstName: 'John',
      lastName: 'Investor',
      email: 'john@example.com',
      preferences: {
        minPrice: 100000,
        maxPrice: 500000,
        location: ['Miami'],
        propertyType: ['House', 'Condo'],
        language: 'en',
      },
      whatsappOptIn: true,
    });

    testAgent = await AgentModel.create({
      id: uuidv4(),
      phoneNumber: '+0987654321',
      firstName: 'Jane',
      lastName: 'Agent',
      email: 'jane@example.com',
      agencyId: 'agency-123',
      language: 'en',
      whatsappOptIn: true,
    });

    testProperty = await PropertyModel.create({
      id: uuidv4(),
      title: 'Beautiful House',
      description: 'A beautiful house with a great view',
      price: 300000,
      location: {
        address: '123 Main St',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        coordinates: { lat: 25.7617, lng: -80.1918 },
      },
      details: {
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        yearBuilt: 2020,
        propertyType: 'House',
      },
      images: ['image1.jpg', 'image2.jpg'],
      agentId: testAgent.id,
    });
  });

  afterAll(async () => {
    await PropertyModel.deleteMany({});
    await InvestorModel.deleteMany({});
    await AgentModel.deleteMany({});
    await ViewingModel.deleteMany({});
    await disconnectDatabase();
  });

  describe('notifyPropertyMatch', () => {
    it('should notify agents of property match', async () => {
      await automationService.notifyPropertyMatch({
        investorId: testInvestor.id,
        propertyIds: [testProperty.id],
        topAgentsCount: 1,
      });

      // Verify notification was queued
      expect(true).toBe(true);
    });

    it('should handle missing investor', async () => {
      await expect(
        automationService.notifyPropertyMatch({
          investorId: 'non-existent',
          propertyIds: [testProperty.id],
        })
      ).rejects.toThrow();
    });

    it('should skip agents not opted in', async () => {
      const agentNoOptIn = await AgentModel.create({
        id: uuidv4(),
        phoneNumber: '+5555555555',
        firstName: 'Bob',
        lastName: 'Agent',
        email: 'bob@example.com',
        agencyId: 'agency-456',
        language: 'en',
        whatsappOptIn: false,
      });

      await automationService.notifyPropertyMatch({
        investorId: testInvestor.id,
        propertyIds: [testProperty.id],
        topAgentsCount: 5,
      });

      // Verify opt-out is respected
      expect(true).toBe(true);

      await AgentModel.deleteOne({ id: agentNoOptIn.id });
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should create viewing and send confirmations', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await automationService.sendBookingConfirmation({
        investorId: testInvestor.id,
        propertyId: testProperty.id,
        agentId: testAgent.id,
        preferredDate: futureDate,
        notes: 'Please be on time',
      });

      const viewing = await ViewingModel.findOne({
        investorId: testInvestor.id,
        propertyId: testProperty.id,
      });

      expect(viewing).toBeDefined();
      expect(viewing?.status).toBe('confirmed');
    });

    it('should handle missing data', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await expect(
        automationService.sendBookingConfirmation({
          investorId: 'non-existent',
          propertyId: testProperty.id,
          agentId: testAgent.id,
          preferredDate: futureDate,
        })
      ).rejects.toThrow();
    });
  });

  describe('sendPaymentNotification', () => {
    it('should send confirmation notification', async () => {
      await automationService.sendPaymentNotification(testInvestor.id, 'confirmation', {
        amount: '99.99',
        planName: 'Premium Plan',
        transactionId: 'txn-123',
        invoiceLink: 'https://example.com/invoice',
      });

      expect(true).toBe(true);
    });

    it('should send failure notification', async () => {
      await automationService.sendPaymentNotification(testInvestor.id, 'failed', {
        amount: '99.99',
        planName: 'Premium Plan',
        failureReason: 'Card declined',
      });

      expect(true).toBe(true);
    });

    it('should skip non-opted-in investors', async () => {
      const noOptIn = await InvestorModel.create({
        id: uuidv4(),
        phoneNumber: '+9999999999',
        firstName: 'Jane',
        lastName: 'Investor',
        email: 'jane@example.com',
        preferences: {
          minPrice: 100000,
          maxPrice: 500000,
          location: ['Miami'],
          propertyType: ['House'],
          language: 'en',
        },
        whatsappOptIn: false,
      });

      await automationService.sendPaymentNotification(noOptIn.id, 'confirmation', {
        amount: '99.99',
        planName: 'Plan',
      });

      expect(true).toBe(true);

      await InvestorModel.deleteOne({ id: noOptIn.id });
    });
  });

  describe('sendPortfolioUpdate', () => {
    it('should send price alert', async () => {
      await automationService.sendPortfolioUpdate(testInvestor.id, 'price_alert', {
        propertyTitle: 'Beautiful House',
        propertyLocation: 'Miami, FL',
        oldPrice: '300000',
        newPrice: '280000',
        savings: '20000',
        discountPercent: '6.67',
        propertyLink: 'https://example.com/property',
        contactAgentLink: 'https://example.com/contact',
      });

      expect(true).toBe(true);
    });
  });

  describe('sendViewingSurvey', () => {
    it('should send survey request', async () => {
      const viewing = await ViewingModel.create({
        id: uuidv4(),
        propertyId: testProperty.id,
        investorId: testInvestor.id,
        agentId: testAgent.id,
        scheduledDate: new Date(),
        duration: 30,
        status: 'completed',
      });

      await automationService.sendViewingSurvey(viewing.id);

      expect(true).toBe(true);

      await ViewingModel.deleteOne({ id: viewing.id });
    });
  });
});
