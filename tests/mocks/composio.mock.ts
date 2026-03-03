export const mockComposioClient = {
  getConnectedAccounts: jest.fn().mockResolvedValue({
    accounts: [
      {
        id: 'test-account-1',
        name: 'Test WhatsApp Account',
        status: 'active',
      },
    ],
  }),

  executeAction: jest.fn().mockResolvedValue({
    data: { success: true },
    status: 'success',
  }),

  sendMessage: jest.fn().mockResolvedValue({
    messageId: 'msg-123',
    status: 'sent',
    timestamp: new Date().toISOString(),
  }),

  getWebhooks: jest.fn().mockResolvedValue({
    webhooks: [
      {
        id: 'webhook-1',
        url: 'http://localhost:3000/webhooks',
        events: ['message.received'],
        active: true,
      },
    ],
  }),

  createWebhook: jest.fn().mockResolvedValue({
    id: 'webhook-new',
    url: 'http://localhost:3000/webhooks',
    events: ['message.received', 'message.sent'],
    active: true,
  }),

  deleteWebhook: jest.fn().mockResolvedValue({ success: true }),

  getActions: jest.fn().mockResolvedValue({
    actions: [
      {
        name: 'send_message',
        description: 'Send a WhatsApp message',
      },
    ],
  }),

  getTriggers: jest.fn().mockResolvedValue({
    triggers: [
      {
        name: 'message_received',
        description: 'Triggered when a message is received',
      },
    ],
  }),
};

export const createMockComposioClient = () => ({
  ...mockComposioClient,
  reset: () => {
    Object.values(mockComposioClient).forEach((fn) => {
      if (typeof fn === 'object' && 'mockClear' in fn) {
        fn.mockClear();
      }
    });
  },
});
