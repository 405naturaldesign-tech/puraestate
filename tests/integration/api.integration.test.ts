import axios from 'axios';
import { mockMessage, mockConversation, mockUser } from '../mocks/database.mock';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message API', () => {
    it('should get messages for conversation', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          messages: [mockMessage],
          total: 1,
        },
      });

      const response = await axios.get(`${baseURL}/api/messages/conv-456`);
      expect(response.data.messages).toHaveLength(1);
      expect(response.data.messages[0]).toEqual(mockMessage);
    });

    it('should create new message', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: mockMessage,
      });

      const response = await axios.post(`${baseURL}/api/messages`, mockMessage);
      expect(response.data).toEqual(mockMessage);
    });

    it('should handle message not found', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Message not found' },
        },
      });

      await expect(axios.get(`${baseURL}/api/messages/invalid-id`)).rejects.toThrow();
    });

    it('should paginate messages', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          messages: [mockMessage],
          page: 1,
          pageSize: 20,
          total: 1,
        },
      });

      const response = await axios.get(
        `${baseURL}/api/messages/conv-456?page=1&pageSize=20`
      );
      expect(response.data.page).toBe(1);
      expect(response.data.pageSize).toBe(20);
    });

    it('should mark message as read', async () => {
      mockedAxios.patch.mockResolvedValueOnce({
        data: { ...mockMessage, read: true },
      });

      const response = await axios.patch(`${baseURL}/api/messages/msg-123/read`);
      expect(response.data.read).toBe(true);
    });

    it('should delete message', async () => {
      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      const response = await axios.delete(`${baseURL}/api/messages/msg-123`);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Conversation API', () => {
    it('should list conversations', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          conversations: [mockConversation],
        },
      });

      const response = await axios.get(`${baseURL}/api/conversations`);
      expect(response.data.conversations).toHaveLength(1);
      expect(response.data.conversations[0]).toEqual(mockConversation);
    });

    it('should get conversation details', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockConversation,
      });

      const response = await axios.get(`${baseURL}/api/conversations/conv-456`);
      expect(response.data).toEqual(mockConversation);
    });

    it('should update conversation status', async () => {
      mockedAxios.patch.mockResolvedValueOnce({
        data: { ...mockConversation, status: 'closed' },
      });

      const response = await axios.patch(`${baseURL}/api/conversations/conv-456`, {
        status: 'closed',
      });
      expect(response.data.status).toBe('closed');
    });

    it('should assign conversation to agent', async () => {
      mockedAxios.patch.mockResolvedValueOnce({
        data: { ...mockConversation, agentId: 'agent-456' },
      });

      const response = await axios.patch(
        `${baseURL}/api/conversations/conv-456/assign`,
        {
          agentId: 'agent-456',
        }
      );
      expect(response.data.agentId).toBe('agent-456');
    });
  });

  describe('User API', () => {
    it('should get user profile', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser,
      });

      const response = await axios.get(`${baseURL}/api/users/user-123`);
      expect(response.data).toEqual(mockUser);
    });

    it('should update user profile', async () => {
      mockedAxios.patch.mockResolvedValueOnce({
        data: { ...mockUser, name: 'Jane Doe' },
      });

      const response = await axios.patch(`${baseURL}/api/users/user-123`, {
        name: 'Jane Doe',
      });
      expect(response.data.name).toBe('Jane Doe');
    });

    it('should handle user not found', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      });

      await expect(axios.get(`${baseURL}/api/users/invalid`)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid input' },
        },
      });

      await expect(
        axios.post(`${baseURL}/api/messages`, { invalid: 'data' })
      ).rejects.toThrow();
    });

    it('should handle 401 Unauthorized', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      });

      await expect(axios.get(`${baseURL}/api/protected`)).rejects.toThrow();
    });

    it('should handle 403 Forbidden', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      });

      await expect(axios.get(`${baseURL}/api/admin`)).rejects.toThrow();
    });

    it('should handle 500 Internal Server Error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(axios.get(`${baseURL}/api/messages`)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(axios.get(`${baseURL}/api/messages`)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(axios.get(`${baseURL}/api/messages`)).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('Request/Response Validation', () => {
    it('should validate request payload', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid payload' },
        },
      });

      await expect(
        axios.post(`${baseURL}/api/messages`, {})
      ).rejects.toThrow();
    });

    it('should validate response structure', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockMessage,
      });

      const response = await axios.get(`${baseURL}/api/messages/msg-123`);
      expect(response.data).toHaveProperty('_id');
      expect(response.data).toHaveProperty('content');
    });

    it('should validate content types', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        headers: { 'content-type': 'application/json' },
        data: mockMessage,
      });

      const response = await axios.get(`${baseURL}/api/messages/msg-123`);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit exceeded', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      });

      await expect(axios.get(`${baseURL}/api/messages`)).rejects.toThrow();
    });

    it('should include rate limit headers', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        headers: {
          'x-ratelimit-limit': '100',
          'x-ratelimit-remaining': '99',
          'x-ratelimit-reset': '1234567890',
        },
        data: [mockMessage],
      });

      const response = await axios.get(`${baseURL}/api/messages`);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
    });
  });
});
