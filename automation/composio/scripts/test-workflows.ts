import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../src/db/connection';
import automationService from '../src/services/automation.service';
import messageService from '../src/services/message.service';
import { InvestorModel, AgentModel, PropertyModel } from '../src/db/schemas';
import logger from '../src/logger';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * Comprehensive workflow testing script
 */

async function createTestData() {
  logger.info('Creating test data...');

  // Create investor
  const investor = await InvestorModel.create({
    id: uuidv4(),
    phoneNumber: process.env.TEST_PHONE_NUMBER || '+1234567890',
    firstName: 'Test',
    lastName: 'Investor',
    email: 'test.investor@example.com',
    preferences: {
      minPrice: 100000,
      maxPrice: 500000,
      location: ['Miami'],
      propertyType: ['House', 'Condo'],
      language: 'en',
    },
    whatsappOptIn: true,
  });

  // Create agent
  const agent = await AgentModel.create({
    id: uuidv4(),
    phoneNumber: '+0987654321',
    firstName: 'Test',
    lastName: 'Agent',
    email: 'test.agent@example.com',
    agencyId: 'test-agency',
    language: 'en',
    whatsappOptIn: true,
  });

  // Create property
  const property = await PropertyModel.create({
    id: uuidv4(),
    title: 'Luxury Penthouse',
    description: 'Amazing luxury penthouse with ocean views',
    price: 350000,
    location: {
      address: '123 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      coordinates: { lat: 25.7617, lng: -80.1918 },
    },
    details: {
      bedrooms: 3,
      bathrooms: 3,
      area: 2500,
      yearBuilt: 2022,
      propertyType: 'Penthouse',
    },
    images: ['https://example.com/image1.jpg'],
    agentId: agent.id,
  });

  logger.info('Test data created', {
    investorId: investor.id,
    agentId: agent.id,
    propertyId: property.id,
  });

  return { investor, agent, property };
}

async function testWorkflow1_PropertyMatch(
  investorId: string,
  propertyIds: string[]
): Promise<void> {
  logger.info('Testing Workflow 1: Property Match Notification');

  try {
    await automationService.notifyPropertyMatch({
      investorId,
      propertyIds,
      topAgentsCount: 1,
    });

    logger.info('✓ Workflow 1 completed');
  } catch (error) {
    logger.error('✗ Workflow 1 failed', { error });
  }
}

async function testWorkflow2_BookingConfirmation(
  investorId: string,
  propertyId: string,
  agentId: string
): Promise<void> {
  logger.info('Testing Workflow 2: Booking Confirmation');

  try {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await automationService.sendBookingConfirmation({
      investorId,
      propertyId,
      agentId,
      preferredDate: futureDate,
      notes: 'Test booking',
    });

    logger.info('✓ Workflow 2 completed');
  } catch (error) {
    logger.error('✗ Workflow 2 failed', { error });
  }
}

async function testWorkflow3_ViewingReminders(viewingId: string): Promise<void> {
  logger.info('Testing Workflow 3: Viewing Reminders');

  try {
    await automationService.scheduleViewingReminders(viewingId);

    logger.info('✓ Workflow 3 completed');
  } catch (error) {
    logger.error('✗ Workflow 3 failed', { error });
  }
}

async function testWorkflow4_PaymentNotifications(investorId: string): Promise<void> {
  logger.info('Testing Workflow 4: Payment Notifications');

  try {
    // Test confirmation
    await automationService.sendPaymentNotification(investorId, 'confirmation', {
      amount: '99.99',
      currency: 'USD',
      planName: 'Premium Plan',
      transactionId: 'txn-' + uuidv4(),
      invoiceLink: 'https://example.com/invoice',
    });

    // Test failure
    await automationService.sendPaymentNotification(investorId, 'failed', {
      amount: '99.99',
      currency: 'USD',
      planName: 'Premium Plan',
      failureReason: 'Card declined',
    });

    logger.info('✓ Workflow 4 completed');
  } catch (error) {
    logger.error('✗ Workflow 4 failed', { error });
  }
}

async function testWorkflow5_PortfolioUpdates(investorId: string): Promise<void> {
  logger.info('Testing Workflow 5: Portfolio Updates');

  try {
    await automationService.sendPortfolioUpdate(investorId, 'price_alert', {
      propertyTitle: 'Luxury Penthouse',
      propertyLocation: 'Miami, FL',
      oldPrice: '350000',
      newPrice: '325000',
      savings: '25000',
      discountPercent: '7.14',
      propertyLink: 'https://example.com/property',
      contactAgentLink: 'https://example.com/contact',
    });

    logger.info('✓ Workflow 5 completed');
  } catch (error) {
    logger.error('✗ Workflow 5 failed', { error });
  }
}

async function testDirectMessage(): Promise<void> {
  logger.info('Testing Direct Message Send');

  try {
    const phoneNumber = process.env.TEST_PHONE_NUMBER || '+1234567890';

    const message = await messageService.sendMessage({
      phoneNumber,
      message: 'Hello from PuraEstate! This is a test message from Composio integration.',
    });

    logger.info('✓ Direct message queued', { messageId: message.id });
  } catch (error) {
    logger.error('✗ Direct message failed', { error });
  }
}

async function runAllTests(): Promise<void> {
  try {
    logger.info('Starting PuraEstate Composio Integration Tests');
    logger.info('============================================');

    await connectDatabase();

    // Create test data
    const { investor, agent, property } = await createTestData();

    // Run workflow tests
    await testWorkflow1_PropertyMatch(investor.id, [property.id]);
    await testWorkflow2_BookingConfirmation(investor.id, property.id, agent.id);
    await testWorkflow4_PaymentNotifications(investor.id);
    await testWorkflow5_PortfolioUpdates(investor.id);
    await testDirectMessage();

    logger.info('============================================');
    logger.info('All tests completed!');
    logger.info('Check logs for results and messages');
  } catch (error) {
    logger.error('Test suite failed', { error });
  } finally {
    await disconnectDatabase();
  }
}

// Run tests
runAllTests().catch((error) => {
  logger.error('Fatal error', { error });
  process.exit(1);
});
