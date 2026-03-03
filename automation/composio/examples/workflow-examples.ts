/**
 * PuraEstate Composio WhatsApp Integration - Workflow Examples
 *
 * This file demonstrates how to use each workflow in your application.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const ADMIN_BASE_URL = 'http://localhost:3000/admin';
const ADMIN_TOKEN = 'your_admin_token';

// Helper function for API calls
async function apiCall<T>(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: any,
  isAdmin: boolean = false
): Promise<T> {
  const baseUrl = isAdmin ? ADMIN_BASE_URL : API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  const config: any = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (isAdmin) {
    config.headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  }

  if (data) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
}

// =====================================================================
// WORKFLOW 1: Property Match Notification
// =====================================================================

export async function examplePropertyMatch() {
  console.log('=== Workflow 1: Property Match Notification ===\n');

  try {
    const response = await apiCall('POST', '/automations/property-match', {
      investorId: 'investor-001',
      propertyIds: ['property-001', 'property-002', 'property-003'],
      topAgentsCount: 3,
    });

    console.log('Property match notification queued:');
    console.log(response);
    console.log('\nWhat happens next:');
    console.log('1. System finds investor preferences (price, location, type)');
    console.log('2. Identifies top 3 agents for each property');
    console.log('3. Sends WhatsApp message to each agent with:');
    console.log('   - Investor name and preferences');
    console.log('   - Property details (price, location, beds/baths)');
    console.log('   - Link to investor profile');
    console.log('4. Agents can respond through WhatsApp\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// WORKFLOW 2: Booking Confirmation
// =====================================================================

export async function exampleBookingConfirmation() {
  console.log('=== Workflow 2: Booking Confirmation ===\n');

  try {
    const viewingDate = new Date();
    viewingDate.setDate(viewingDate.getDate() + 2); // 2 days from now

    const response = await apiCall('POST', '/automations/booking', {
      investorId: 'investor-001',
      propertyId: 'property-001',
      agentId: 'agent-001',
      preferredDate: viewingDate.toISOString(),
      notes: 'Please arrive 5 minutes early. Parking available.',
    });

    console.log('Booking confirmation queued:');
    console.log(response);
    console.log('\nWhat happens next:');
    console.log('1. Viewing record created with status "confirmed"');
    console.log('2. WhatsApp to investor with:');
    console.log('   - Property address and details');
    console.log('   - Date and time');
    console.log('   - Agent contact information');
    console.log('   - Calendar invite link');
    console.log('3. WhatsApp to agent with same details');
    console.log('4. Reminders scheduled for 24h and 1h before\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// WORKFLOW 3: Viewing Reminders
// =====================================================================

export async function exampleViewingReminders() {
  console.log('=== Workflow 3: Viewing Reminders (Automatic) ===\n');

  console.log('Reminders are automatically scheduled when booking is confirmed:');
  console.log('\nTimeline:');
  console.log('- T-24h: WhatsApp reminder');
  console.log('  "Your property viewing is tomorrow at 2:00 PM"');
  console.log('\n- T-1h: WhatsApp + Push notification');
  console.log('  "Your viewing starts in 1 hour!"');
  console.log('\n- T+0: (During viewing)');
  console.log('  Agent can update status in app');
  console.log('\n- T+1h: Survey request');
  console.log('  "How was your viewing experience?"\n');
}

// =====================================================================
// WORKFLOW 4: Payment Notifications
// =====================================================================

export async function examplePaymentNotification() {
  console.log('=== Workflow 4: Payment Notifications ===\n');

  // Example 1: Payment Confirmation
  console.log('Scenario 1: Successful Payment\n');
  try {
    const confirmResponse = await apiCall('POST', '/automations/payment', {
      investorId: 'investor-001',
      type: 'confirmation',
      paymentData: {
        amount: '99.99',
        currency: 'USD',
        planName: 'Premium Monthly',
        transactionId: 'txn_123456789',
        invoiceLink: 'https://puraestatecomposio.com/invoice/inv_123',
      },
    });

    console.log('Confirmation queued:');
    console.log(confirmResponse);
    console.log('\nInvestor receives WhatsApp:');
    console.log(
      '"💳 Payment Confirmed\n\nYour subscription payment of $99.99 has been processed.\n' +
        'Plan: Premium Monthly\nTransaction ID: txn_123456789\nInvoice: [link]"'
    );
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Example 2: Payment Failed
  console.log('Scenario 2: Payment Failed\n');
  try {
    const failResponse = await apiCall('POST', '/automations/payment', {
      investorId: 'investor-001',
      type: 'failed',
      paymentData: {
        amount: '99.99',
        currency: 'USD',
        planName: 'Premium Monthly',
        failureReason: 'Card declined',
      },
    });

    console.log('Failure notification queued:');
    console.log(failResponse);
    console.log('\nInvestor receives WhatsApp:');
    console.log(
      '"⚠️ Payment Failed\n\nWe encountered an issue processing your payment.\n' +
        'Amount: $99.99\nReason: Card declined\nUpdate payment method: [link]"'
    );
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n');
}

// =====================================================================
// WORKFLOW 5: Portfolio Updates
// =====================================================================

export async function examplePortfolioUpdate() {
  console.log('=== Workflow 5: Portfolio Updates ===\n');

  try {
    const response = await apiCall('POST', '/automations/portfolio-update', {
      investorId: 'investor-001',
      updateType: 'price_alert',
      data: {
        propertyTitle: 'Luxury Penthouse Downtown',
        propertyLocation: 'Miami, FL',
        oldPrice: '350000',
        newPrice: '325000',
        savings: '25000',
        discountPercent: '7.14',
        propertyLink: 'https://puraestatecomposio.com/property/prop_001',
        contactAgentLink: 'https://puraestatecomposio.com/contact/agent_001',
      },
    });

    console.log('Portfolio update queued:');
    console.log(response);
    console.log('\nInvestor receives WhatsApp:');
    console.log(
      '"📉 Price Drop Alert!\n\nLuxury Penthouse Downtown reduced its price:\n' +
        'Old: $350,000\nNew: $325,000\n' +
        'Savings: $25,000 (7.14% off)\n\n' +
        'This is your chance! View listing: [link]"'
    );
    console.log('\nOther portfolio update types:');
    console.log('- new_property: "New property matches your preferences"');
    console.log('- market_news: "Market update relevant to your portfolio"\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Direct Message Send
// =====================================================================

export async function exampleDirectMessage() {
  console.log('=== Direct Message Send ===\n');

  try {
    const response = await apiCall('POST', '/messages/send', {
      phoneNumber: '+1234567890',
      message: 'Hello! Your property viewing is tomorrow at 2 PM. Looking forward to seeing you!',
      mediaUrl: undefined,
      mediaType: undefined,
    });

    console.log('Message queued:');
    console.log(response);
    console.log('\nMessage status flow:');
    console.log('1. Queued (in database and queue)');
    console.log('2. Sent (delivered to Composio)');
    console.log('3. Delivered (received by WhatsApp)');
    console.log('4. Read (opened by recipient)\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Message Status Tracking
// =====================================================================

export async function exampleMessageTracking() {
  console.log('=== Message Status Tracking ===\n');

  try {
    // Send a message
    const sendResponse = await apiCall('POST', '/messages/send', {
      phoneNumber: '+1234567890',
      message: 'Your viewing confirmation',
    });

    const messageId = sendResponse.data.id;

    // Check status after a delay
    setTimeout(async () => {
      const statusResponse = await apiCall('GET', `/messages/${messageId}/status`);

      console.log('Message details:');
      console.log(`- ID: ${statusResponse.data.id}`);
      console.log(`- Status: ${statusResponse.data.status}`);
      console.log(`- Phone: ${statusResponse.data.recipientPhoneNumber}`);
      console.log(`- Created: ${statusResponse.data.createdAt}`);
      console.log(`- Sent at: ${statusResponse.data.sentAt || 'pending'}`);
      console.log(`- Delivered at: ${statusResponse.data.deliveredAt || 'pending'}`);
      console.log(`- Read at: ${statusResponse.data.readAt || 'pending'}`);
    }, 5000);
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Bulk Messages
// =====================================================================

export async function exampleBulkMessages() {
  console.log('=== Bulk Messages ===\n');

  try {
    const response = await apiCall('POST', '/messages/bulk', {
      phoneNumbers: ['+1111111111', '+2222222222', '+3333333333'],
      message: '🏠 Check out these amazing properties matching your preferences!',
      delayBetweenMs: 100, // 100ms between each message
    });

    console.log('Bulk send response:');
    console.log(`Total sent: ${response.data.totalSend}`);
    console.log(`Messages: ${response.data.messages.length}`);
    console.log('\nUse cases:');
    console.log('- Campaign announcements');
    console.log('- Agent notifications');
    console.log('- Market updates\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Admin Dashboard
// =====================================================================

export async function exampleAdminDashboard() {
  console.log('=== Admin Dashboard ===\n');

  try {
    const statsResponse = await apiCall('GET', '/dashboard/stats', null, true);

    console.log('Dashboard Statistics:');
    console.log('\nMessages:');
    console.log(`- Total: ${statsResponse.data.messages.total}`);
    console.log(`- Sent: ${statsResponse.data.messages.sent}`);
    console.log(`- Delivered: ${statsResponse.data.messages.delivered}`);
    console.log(`- Read: ${statsResponse.data.messages.read}`);
    console.log(`- Failed: ${statsResponse.data.messages.failed}`);
    console.log(`- Queued: ${statsResponse.data.messages.queued}`);

    console.log('\nPerformance Rates:');
    console.log(`- Delivery Rate: ${statsResponse.data.rates.deliveryRate}`);
    console.log(`- Read Rate: ${statsResponse.data.rates.readRate}`);
    console.log(`- Failure Rate: ${statsResponse.data.rates.failureRate}`);

    console.log('\nQueue Status:');
    for (const [queue, stats] of Object.entries(statsResponse.data.queues)) {
      console.log(`- ${queue}: ${JSON.stringify(stats)}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Failed Messages & Retry
// =====================================================================

export async function exampleFailedMessageRetry() {
  console.log('=== Failed Messages & Retry ===\n');

  try {
    // Get failed messages
    const failedResponse = await apiCall('GET', '/messages/failed?limit=10');

    console.log(`Found ${failedResponse.data.length} failed messages`);

    if (failedResponse.data.length > 0) {
      const failedMessage = failedResponse.data[0];
      console.log(`\nFirst failed message:`);
      console.log(`- ID: ${failedMessage.id}`);
      console.log(`- Phone: ${failedMessage.recipientPhoneNumber}`);
      console.log(`- Error: ${failedMessage.errorMessage}`);
      console.log(`- Retries: ${failedMessage.retries}/${failedMessage.maxRetries}`);

      // Retry the message
      if (failedMessage.retries < failedMessage.maxRetries) {
        const retryResponse = await apiCall('POST', `/messages/${failedMessage.id}/retry`);
        console.log('\nRetry initiated:');
        console.log(retryResponse);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// =====================================================================
// Run Examples
// =====================================================================

async function runAllExamples() {
  const examples = [
    { name: 'Property Match', fn: examplePropertyMatch },
    { name: 'Booking Confirmation', fn: exampleBookingConfirmation },
    { name: 'Viewing Reminders', fn: exampleViewingReminders },
    { name: 'Payment Notifications', fn: examplePaymentNotification },
    { name: 'Portfolio Updates', fn: examplePortfolioUpdate },
    { name: 'Direct Message', fn: exampleDirectMessage },
    { name: 'Message Tracking', fn: exampleMessageTracking },
    { name: 'Bulk Messages', fn: exampleBulkMessages },
    { name: 'Admin Dashboard', fn: exampleAdminDashboard },
    { name: 'Failed Message Retry', fn: exampleFailedMessageRetry },
  ];

  console.log('PuraEstate Composio WhatsApp Integration - Examples\n');
  console.log('======================================================\n');

  for (const example of examples) {
    console.log(`\n${'='.repeat(80)}\n`);
    await example.fn();
    console.log(`\n${'-'.repeat(80)}\n`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n======================================================');
  console.log('All examples completed!');
  console.log('======================================================\n');
}

// Export for manual usage
export default {
  examplePropertyMatch,
  exampleBookingConfirmation,
  exampleViewingReminders,
  examplePaymentNotification,
  examplePortfolioUpdate,
  exampleDirectMessage,
  exampleMessageTracking,
  exampleBulkMessages,
  exampleAdminDashboard,
  exampleFailedMessageRetry,
  runAllExamples,
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
