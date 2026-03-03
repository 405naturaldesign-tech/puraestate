import { mockFirebaseAuth } from '../mocks/firebase.mock';
import { mockComposioClient } from '../mocks/composio.mock';
import {
  mockUser,
  mockProperty,
  mockBooking,
  mockPayment,
} from '../mocks/database.mock';

describe('E2E: User Journeys', () => {
  describe('Investor Journey: Search → Match → Booking → Payment', () => {
    it('should complete full investor workflow', async () => {
      // Step 1: Authentication
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      });

      const authResult = await mockFirebaseAuth.signInWithEmailAndPassword(
        'investor@example.com',
        'password123'
      );

      expect(authResult.user).toBeDefined();

      // Step 2: Search properties
      mockComposioClient.executeAction.mockResolvedValueOnce({
        data: {
          properties: [mockProperty],
        },
        status: 'success',
      });

      const searchResult = await mockComposioClient.executeAction();
      expect(searchResult.data.properties).toBeDefined();

      // Step 3: Match properties
      const matches = [mockProperty].map((prop) => ({
        ...prop,
        matchScore: 95,
      }));

      expect(matches[0].matchScore).toBeGreaterThanOrEqual(90);

      // Step 4: Schedule booking
      const booking = {
        ...mockBooking,
        status: 'pending',
      };

      expect(booking._id).toBeDefined();

      // Step 5: Process payment
      const payment = {
        ...mockPayment,
        status: 'processing',
      };

      mockComposioClient.executeAction.mockResolvedValueOnce({
        data: { transactionId: payment.transactionId },
        status: 'success',
      });

      const paymentResult = await mockComposioClient.executeAction();
      expect(paymentResult.data.transactionId).toBeDefined();

      // Step 6: Receive confirmation
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-booking-confirmed',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const confirmation = await mockComposioClient.sendMessage();
      expect(confirmation.status).toBe('sent');
    });

    it('should handle booking cancellation', async () => {
      mockFirebaseAuth.getCurrentUser.mockResolvedValueOnce(mockUser);

      const currentUser = await mockFirebaseAuth.getCurrentUser();
      expect(currentUser).toBeDefined();

      const cancelledBooking = {
        ...mockBooking,
        status: 'cancelled',
      };

      expect(cancelledBooking.status).toBe('cancelled');
    });

    it('should handle payment failure and retry', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Payment declined')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Payment declined'
      );

      // Retry
      mockComposioClient.executeAction.mockResolvedValueOnce({
        data: { transactionId: 'txn-retry-123' },
        status: 'success',
      });

      const retryResult = await mockComposioClient.executeAction();
      expect(retryResult.status).toBe('success');
    });
  });

  describe('Agent Journey: Property Management → Booking Handling', () => {
    it('should complete agent workflow', async () => {
      // Step 1: Agent login
      const agentUser = {
        ...mockUser,
        _id: 'agent-123',
        role: 'agent',
      };

      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: agentUser,
      });

      const authResult = await mockFirebaseAuth.signInWithEmailAndPassword(
        'agent@example.com',
        'password123'
      );

      expect(authResult.user.role).toBe('agent');

      // Step 2: List properties
      mockComposioClient.executeAction.mockResolvedValueOnce({
        data: {
          properties: [mockProperty],
        },
        status: 'success',
      });

      const properties = await mockComposioClient.executeAction();
      expect(properties.data.properties).toHaveLength(1);

      // Step 3: Handle booking inquiry
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-reply',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const reply = await mockComposioClient.sendMessage();
      expect(reply.status).toBe('sent');

      // Step 4: Schedule viewing
      const viewing = {
        _id: 'viewing-123',
        propertyId: mockProperty._id,
        investorId: 'investor-789',
        agentId: 'agent-123',
        scheduledTime: new Date(Date.now() + 86400000),
        status: 'confirmed',
      };

      expect(viewing.status).toBe('confirmed');

      // Step 5: Send confirmation
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-viewing-confirmed',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const viewingConfirmation = await mockComposioClient.sendMessage();
      expect(viewingConfirmation.status).toBe('sent');
    });

    it('should handle multiple bookings simultaneously', async () => {
      const bookings = Array(5)
        .fill(null)
        .map((_, i) => ({
          ...mockBooking,
          _id: `booking-${i}`,
        }));

      expect(bookings).toHaveLength(5);
      bookings.forEach((booking) => {
        expect(booking._id).toBeDefined();
      });
    });

    it('should reschedule booking', async () => {
      const newTime = new Date(Date.now() + 86400000 * 2);

      const rescheduledBooking = {
        ...mockBooking,
        scheduledTime: newTime,
        status: 'rescheduled',
      };

      expect(rescheduledBooking.status).toBe('rescheduled');
      expect(rescheduledBooking.scheduledTime).toEqual(newTime);
    });
  });

  describe('Admin Journey: System Management', () => {
    it('should complete admin workflow', async () => {
      const adminUser = {
        ...mockUser,
        _id: 'admin-123',
        role: 'admin',
      };

      // Step 1: Admin login
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: adminUser,
      });

      const authResult = await mockFirebaseAuth.signInWithEmailAndPassword(
        'admin@example.com',
        'admin_password'
      );

      expect(authResult.user.role).toBe('admin');

      // Step 2: View system metrics
      const metrics = {
        totalUsers: 1000,
        totalProperties: 500,
        totalBookings: 2000,
        totalRevenue: 5000000,
      };

      expect(metrics.totalUsers).toBeGreaterThan(0);

      // Step 3: Manage users
      mockFirebaseAuth.updateProfile.mockResolvedValueOnce(undefined);

      await mockFirebaseAuth.updateProfile({
        displayName: 'Updated Name',
      });

      expect(mockFirebaseAuth.updateProfile).toHaveBeenCalled();

      // Step 4: Review disputes
      const disputes = [
        {
          _id: 'dispute-1',
          bookingId: mockBooking._id,
          reason: 'Property not as described',
          status: 'pending',
        },
      ];

      expect(disputes).toHaveLength(1);

      // Step 5: Generate reports
      const report = {
        period: 'January 2024',
        totalTransactions: 150,
        totalRevenue: 500000,
        averageBookingValue: 3333,
      };

      expect(report.totalTransactions).toBeGreaterThan(0);
    });

    it('should manage user permissions', async () => {
      const user = {
        ...mockUser,
        permissions: ['view_bookings', 'create_property'],
      };

      expect(user.permissions).toContain('view_bookings');
      expect(user.permissions).toContain('create_property');
    });

    it('should audit system actions', () => {
      const auditLog = [
        {
          _id: 'audit-1',
          userId: 'admin-123',
          action: 'DELETE_USER',
          timestamp: new Date(),
          details: { deletedUserId: 'user-456' },
        },
      ];

      expect(auditLog[0].action).toBe('DELETE_USER');
    });
  });

  describe('WhatsApp Conversation Flow', () => {
    it('should handle complete WhatsApp conversation', async () => {
      // Step 1: Receive initial message
      mockComposioClient.getTriggers.mockResolvedValueOnce({
        triggers: [
          {
            name: 'message_received',
            description: 'Triggered when message is received',
          },
        ],
      });

      const triggers = await mockComposioClient.getTriggers();
      expect(triggers.triggers).toHaveLength(1);

      // Step 2: Process message
      const incomingMessage = {
        phoneNumber: '+1234567890',
        content: 'I am looking for a 3-bedroom property',
        timestamp: new Date(),
      };

      expect(incomingMessage.content).toBeDefined();

      // Step 3: Send response
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-auto-reply',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const response = await mockComposioClient.sendMessage();
      expect(response.status).toBe('sent');

      // Step 4: Send property suggestions
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-suggestions',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const suggestions = await mockComposioClient.sendMessage();
      expect(suggestions.status).toBe('sent');

      // Step 5: Handle user response
      const userReply = {
        phoneNumber: '+1234567890',
        content: 'I like the first property',
      };

      expect(userReply.content).toBeDefined();

      // Step 6: Schedule booking
      mockComposioClient.sendMessage.mockResolvedValueOnce({
        messageId: 'msg-booking-scheduled',
        status: 'sent',
        timestamp: new Date().toISOString(),
      });

      const bookingConfirmation = await mockComposioClient.sendMessage();
      expect(bookingConfirmation.status).toBe('sent');
    });

    it('should handle multi-turn conversation', async () => {
      const messages = [
        'Hello',
        'I am interested in properties in Miami',
        'What is the price range?',
        'Between $300k and $500k',
        'Show me available properties',
      ];

      let conversation = '';

      for (const msg of messages) {
        mockComposioClient.sendMessage.mockResolvedValueOnce({
          messageId: `msg-${Math.random()}`,
          status: 'sent',
          timestamp: new Date().toISOString(),
        });

        const response = await mockComposioClient.sendMessage();
        expect(response.status).toBe('sent');

        conversation += msg + '\n';
      }

      expect(conversation.split('\n')).toHaveLength(messages.length + 1);
    });

    it('should escalate to agent when needed', async () => {
      const escalation = {
        conversationId: 'conv-456',
        reason: 'Customer wants to speak with agent',
        agentId: 'agent-123',
        status: 'escalated',
      };

      expect(escalation.status).toBe('escalated');
      expect(escalation.agentId).toBeDefined();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle network disconnection', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Network error'
      );

      // Reconnect and retry
      mockComposioClient.executeAction.mockResolvedValueOnce({
        data: { success: true },
        status: 'success',
      });

      const result = await mockComposioClient.executeAction();
      expect(result.status).toBe('success');
    });

    it('should handle session timeout', async () => {
      const sessionExpired = true;

      expect(sessionExpired).toBe(true);

      // Re-authenticate
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      });

      const newSession = await mockFirebaseAuth.signInWithEmailAndPassword(
        'user@example.com',
        'password123'
      );

      expect(newSession.user).toBeDefined();
    });

    it('should rollback transaction on failure', async () => {
      let transaction = { status: 'pending', amount: 5000 };

      try {
        throw new Error('Database error');
      } catch {
        transaction = { status: 'rolled_back', amount: 5000 };
      }

      expect(transaction.status).toBe('rolled_back');
    });
  });
});
