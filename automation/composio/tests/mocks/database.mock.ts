import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export const connectMockDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

export const disconnectMockDatabase = async () => {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
};

export const clearMockDatabase = async () => {
  if (mongoose.connection.db) {
    const collections = mongoose.connection.db.collections();
    for (const collection of await collections) {
      await collection.deleteMany({});
    }
  }
};

export const mockMessage = {
  _id: 'msg-123',
  conversationId: 'conv-456',
  phoneNumber: '+1234567890',
  content: 'Hello, I am looking for a property',
  type: 'incoming',
  timestamp: new Date(),
  processed: false,
  metadata: {},
};

export const mockConversation = {
  _id: 'conv-456',
  phoneNumber: '+1234567890',
  investorId: 'investor-789',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  messageCount: 1,
  lastMessage: 'Hello, I am looking for a property',
};

export const mockUser = {
  _id: 'user-123',
  phoneNumber: '+1234567890',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'investor',
  createdAt: new Date(),
  updatedAt: new Date(),
  verified: true,
};

export const mockProperty = {
  _id: 'prop-123',
  title: 'Beautiful Beachfront Property',
  description: 'A stunning 3-bedroom beachfront property',
  price: 500000,
  location: {
    address: '123 Beach Street',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    coordinates: {
      lat: 25.8102,
      lng: -80.1267,
    },
  },
  amenities: ['pool', 'gym', 'parking'],
  images: ['image1.jpg', 'image2.jpg'],
  agentId: 'agent-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockBooking = {
  _id: 'booking-123',
  propertyId: 'prop-123',
  investorId: 'investor-789',
  agentId: 'agent-123',
  scheduledTime: new Date(Date.now() + 86400000),
  status: 'confirmed',
  notes: 'Interested in viewing',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAgent = {
  _id: 'agent-123',
  name: 'Jane Smith',
  phoneNumber: '+1234567891',
  email: 'agent@example.com',
  licenseNumber: 'FL-123456',
  role: 'agent',
  createdAt: new Date(),
  updatedAt: new Date(),
  verified: true,
  rating: 4.8,
};

export const mockPayment = {
  _id: 'payment-123',
  bookingId: 'booking-123',
  amount: 5000,
  currency: 'USD',
  status: 'completed',
  paymentMethod: 'credit_card',
  transactionId: 'txn-456',
  createdAt: new Date(),
  updatedAt: new Date(),
};
