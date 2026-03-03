import mongoose from 'mongoose';
import { Investor, Agent, Property, Viewing, WhatsAppMessage, Subscription, MessageAnalytics, MessageTemplate, WebhookEvent } from '../types';

// Investor Schema
const investorSchema = new mongoose.Schema<Investor>(
  {
    id: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    preferences: {
      minPrice: { type: Number, required: true },
      maxPrice: { type: Number, required: true },
      location: [String],
      propertyType: [String],
      language: { type: String, enum: ['es', 'en'], default: 'en' },
    },
    whatsappOptIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Agent Schema
const agentSchema = new mongoose.Schema<Agent>(
  {
    id: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    agencyId: { type: String, required: true },
    language: { type: String, enum: ['es', 'en'], default: 'en' },
    whatsappOptIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Property Schema
const propertySchema = new mongoose.Schema<Property>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    previousPrice: Number,
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    details: {
      bedrooms: { type: Number, required: true },
      bathrooms: { type: Number, required: true },
      area: { type: Number, required: true },
      yearBuilt: Number,
      propertyType: { type: String, required: true },
    },
    images: [String],
    agentId: { type: String, required: true },
  },
  { timestamps: true }
);

// Viewing Schema
const viewingSchema = new mongoose.Schema<Viewing>(
  {
    id: { type: String, required: true, unique: true },
    propertyId: { type: String, required: true },
    investorId: { type: String, required: true },
    agentId: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: String,
  },
  { timestamps: true }
);

// WhatsApp Message Schema
const whatsappMessageSchema = new mongoose.Schema<WhatsAppMessage>(
  {
    id: { type: String, required: true, unique: true },
    recipientPhoneNumber: { type: String, required: true },
    recipientType: { type: String, enum: ['investor', 'agent'], required: true },
    recipientId: { type: String, required: true },
    messageType: { type: String, required: true },
    content: {
      text: { type: String, required: true },
      mediaUrl: String,
      mediaType: { type: String, enum: ['image', 'document', 'video'] },
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'delivered', 'read'],
      default: 'queued',
    },
    composioMessageId: String,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    errorMessage: String,
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true }
);

// Subscription Schema
const subscriptionSchema = new mongoose.Schema<Subscription>(
  {
    id: { type: String, required: true, unique: true },
    investorId: { type: String, required: true },
    planId: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    transactionId: String,
  },
  { timestamps: true }
);

// Message Analytics Schema
const messageAnalyticsSchema = new mongoose.Schema<MessageAnalytics>(
  {
    id: { type: String, required: true, unique: true },
    messageId: { type: String, required: true },
    campaignType: { type: String, required: true },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Message Template Schema
const messageTemplateSchema = new mongoose.Schema<MessageTemplate>(
  {
    id: { type: String, required: true, unique: true },
    key: { type: String, required: true },
    category: { type: String, required: true },
    language: { type: String, enum: ['es', 'en'], required: true },
    subject: String,
    body: { type: String, required: true },
    variables: [String],
  },
  { timestamps: true }
);

// Webhook Event Schema
const webhookEventSchema = new mongoose.Schema<WebhookEvent>(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    timestamp: { type: Date, required: true },
    data: mongoose.Schema.Types.Mixed,
    processed: { type: Boolean, default: false },
    processedAt: Date,
  },
  { timestamps: true }
);

// Create indexes
investorSchema.index({ email: 1 });
investorSchema.index({ phoneNumber: 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ phoneNumber: 1 });
propertySchema.index({ agentId: 1 });
propertySchema.index({ price: 1 });
viewingSchema.index({ investorId: 1, propertyId: 1 });
viewingSchema.index({ scheduledDate: 1 });
whatsappMessageSchema.index({ recipientId: 1, createdAt: -1 });
whatsappMessageSchema.index({ status: 1 });
subscriptionSchema.index({ investorId: 1 });
messageAnalyticsSchema.index({ campaignType: 1, createdAt: -1 });
webhookEventSchema.index({ processed: 1 });

// Export models
export const InvestorModel = mongoose.model<Investor>('Investor', investorSchema);
export const AgentModel = mongoose.model<Agent>('Agent', agentSchema);
export const PropertyModel = mongoose.model<Property>('Property', propertySchema);
export const ViewingModel = mongoose.model<Viewing>('Viewing', viewingSchema);
export const WhatsAppMessageModel = mongoose.model<WhatsAppMessage>('WhatsAppMessage', whatsappMessageSchema);
export const SubscriptionModel = mongoose.model<Subscription>('Subscription', subscriptionSchema);
export const MessageAnalyticsModel = mongoose.model<MessageAnalytics>('MessageAnalytics', messageAnalyticsSchema);
export const MessageTemplateModel = mongoose.model<MessageTemplate>('MessageTemplate', messageTemplateSchema);
export const WebhookEventModel = mongoose.model<WebhookEvent>('WebhookEvent', webhookEventSchema);
