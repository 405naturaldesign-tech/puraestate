/**
 * Firebase Cloud Functions - PuraEstate Backend
 * Core business logic for property matching, bookings, payments, notifications
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const db = admin.firestore();
const auth = admin.auth();

/**
 * PROPERTY MATCHING ALGORITHM
 */

// Main property matching orchestration function
exports.matchProperties = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const preferences = user.investmentPreferences;

    // Get all active properties
    const propertiesSnapshot = await db.collection('properties')
      .where('listingStatus', '==', 'active')
      .limit(100)
      .get();

    const properties = propertiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Score and rank properties
    const scoredProperties = properties.map(property => ({
      property,
      score: calculatePropertyScore(property, preferences),
      matchReasons: generateMatchReasons(property, preferences)
    })).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const topMatches = scoredProperties.slice(0, 10);

    // Store match results for future reference
    await db.collection('users').doc(userId).update({
      lastMatchResults: {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        topMatches: topMatches.map(m => ({
          propertyId: m.property.id,
          score: m.score,
          reasons: m.matchReasons
        }))
      }
    });

    // Trigger notifications for top matches
    for (const match of topMatches.slice(0, 3)) {
      await triggerPropertyMatchNotification(userId, match.property, match.score);
    }

    return {
      topMatches,
      totalMatches: scoredProperties.length,
      message: 'Property matching completed'
    };
  } catch (error) {
    console.error('Property matching error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Calculate matching score for a property
function calculatePropertyScore(property, userPreferences) {
  let score = 0;
  let maxScore = 100;

  // Budget matching (40 points)
  if (property.price.amount >= userPreferences.minBudget &&
    property.price.amount <= userPreferences.maxBudget) {
    score += 40;
  } else if (Math.abs(property.price.amount - userPreferences.minBudget) < 50000) {
    score += 20; // Partial score for slight budget mismatch
  }

  // Property type matching (20 points)
  if (userPreferences.propertyTypes.includes(property.propertyType)) {
    score += 20;
  }

  // Location matching (20 points)
  if (userPreferences.locations.some(loc =>
    loc.city === property.address.city || loc.state === property.address.state)) {
    score += 20;
  }

  // ROI matching (15 points)
  if (property.investmentReturns) {
    const expectedROI = property.investmentReturns.expectedROI || 0;
    const riskTolerance = userPreferences.riskTolerance;

    if ((riskTolerance === 'low' && expectedROI >= 5) ||
      (riskTolerance === 'medium' && expectedROI >= 8) ||
      (riskTolerance === 'high' && expectedROI >= 10)) {
      score += 15;
    }
  }

  // Market trend bonus (5 points)
  if (property.marketData?.demandScore > 7) {
    score += 5;
  }

  return Math.min(score, maxScore);
}

// Generate reasons for property match
function generateMatchReasons(property, userPreferences) {
  const reasons = [];

  if (property.price.amount >= userPreferences.minBudget &&
    property.price.amount <= userPreferences.maxBudget) {
    reasons.push(`Matches your budget of $${userPreferences.minBudget}-${userPreferences.maxBudget}`);
  }

  if (userPreferences.propertyTypes.includes(property.propertyType)) {
    reasons.push(`${property.propertyType} matches your preferences`);
  }

  if (userPreferences.locations.some(loc =>
    loc.city === property.address.city)) {
    reasons.push(`Located in your preferred area: ${property.address.city}`);
  }

  if (property.investmentReturns?.expectedROI >= 10) {
    reasons.push(`Strong ROI potential: ${property.investmentReturns.expectedROI}%`);
  }

  return reasons;
}

// Trigger notification for property match
async function triggerPropertyMatchNotification(userId, property, score) {
  await db.collection('notifications').add({
    userId,
    type: 'new_property_match',
    title: `New Property Match: ${property.title}`,
    body: `We found a property matching your criteria with a ${Math.round(score)}% match score`,
    imageUrl: property.imageUrl || '',
    actionUrl: `/property/${property.id}`,
    channelType: ['push', 'email'],
    relatedEntityType: 'property',
    relatedEntityId: property.id,
    isRead: false,
    priority: score > 80 ? 'high' : 'normal',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * BOOKING MANAGEMENT
 */

// Create booking and notify agent
exports.handleBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { propertyId, scheduledDate, duration, meetingType, notes } = data;
    const userId = context.auth.uid;

    // Validate inputs
    if (!propertyId || !scheduledDate || !duration) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required booking fields');
    }

    // Get property
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Property not found');
    }

    const property = propertyDoc.data();
    const agentId = property.agentId;

    // Check for conflicting bookings
    const conflictingBookings = await db.collection('bookings')
      .where('propertyId', '==', propertyId)
      .where('status', '==', 'confirmed')
      .where('scheduledDate', '>=', new Date(scheduledDate - duration * 60000))
      .where('scheduledDate', '<=', new Date(scheduledDate))
      .get();

    if (!conflictingBookings.empty) {
      throw new functions.https.HttpsError('unavailable', 'Time slot not available');
    }

    // Create booking document
    const bookingRef = db.collection('bookings').doc();
    const bookingId = bookingRef.id;

    const bookingData = {
      bookingId,
      userId,
      propertyId,
      agentId,
      bookingType: 'viewing',
      scheduledDate: new Date(scheduledDate),
      duration,
      status: 'pending',
      notes,
      meetingType: meetingType || 'in-person',
      meetingLink: '',
      cancelledAt: null,
      cancellationReason: '',
      feedback: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await bookingRef.set(bookingData);

    // Update property booking count
    await propertyDoc.ref.update({
      bookingCount: admin.firestore.FieldValue.increment(1)
    });

    // Notify agent
    const agentDoc = await db.collection('users').doc(agentId).get();
    const agentData = agentDoc.data();

    // Create notification for agent
    await db.collection('notifications').add({
      userId: agentId,
      type: 'booking_confirmation',
      title: 'New Booking Request',
      body: `New viewing request for ${property.title}`,
      imageUrl: property.imageUrl || '',
      actionUrl: `/bookings/${bookingId}`,
      channelType: ['push', 'email', 'sms'],
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
      isRead: false,
      priority: 'high',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send SMS to agent if phone number exists
    if (agentData.phoneNumber) {
      await sendSMSNotification(
        agentData.phoneNumber,
        `New booking for ${property.title} on ${new Date(scheduledDate).toLocaleDateString()}`
      );
    }

    // Create notification for user
    await db.collection('notifications').add({
      userId,
      type: 'booking_confirmation',
      title: 'Booking Request Submitted',
      body: `Your viewing request for ${property.title} has been submitted`,
      actionUrl: `/bookings/${bookingId}`,
      channelType: ['push', 'email'],
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
      isRead: false,
      priority: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      bookingId,
      status: 'pending',
      message: 'Booking request created and sent to agent'
    };
  } catch (error) {
    console.error('Booking creation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Confirm/Reject booking
exports.updateBookingStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId, status, meetingLink } = data;
    const agentId = context.auth.uid;

    // Get booking
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    const booking = bookingDoc.data();

    // Verify agent is owner
    if (booking.agentId !== agentId) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this booking');
    }

    // Update booking
    await bookingDoc.ref.update({
      status,
      meetingLink: meetingLink || booking.meetingLink,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify user of status change
    const statusMessage = status === 'confirmed' ? 'confirmed' : 'rejected';
    await db.collection('notifications').add({
      userId: booking.userId,
      type: 'booking_confirmation',
      title: `Booking ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
      body: `Your booking for property viewing has been ${statusMessage}`,
      actionUrl: `/bookings/${bookingId}`,
      channelType: ['push', 'email'],
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
      isRead: false,
      priority: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      bookingId,
      status,
      message: `Booking ${statusMessage} successfully`
    };
  } catch (error) {
    console.error('Booking update error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cancel booking
exports.cancelBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { bookingId, cancellationReason } = data;
    const userId = context.auth.uid;

    // Get booking
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    const booking = bookingDoc.data();

    // Verify user is owner
    if (booking.userId !== userId && context.auth.token.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to cancel this booking');
    }

    // Cancel booking
    await bookingDoc.ref.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancellationReason: cancellationReason || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify agent
    await db.collection('notifications').add({
      userId: booking.agentId,
      type: 'booking_confirmation',
      title: 'Booking Cancelled',
      body: `Booking for property viewing has been cancelled`,
      actionUrl: `/bookings/${bookingId}`,
      channelType: ['push', 'email'],
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
      isRead: false,
      priority: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      bookingId,
      message: 'Booking cancelled successfully'
    };
  } catch (error) {
    console.error('Booking cancellation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * PAYMENT PROCESSING
 */

// Process payment via Stripe
exports.processPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, currency, paymentMethodId, purpose, metadata } = data;
    const userId = context.auth.uid;

    if (!amount || !currency || !paymentMethodId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required payment fields');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId,
        purpose,
        ...metadata
      }
    });

    const paymentRef = db.collection('payments').doc();

    // Create payment record
    const paymentData = {
      paymentId: paymentRef.id,
      userId,
      amount,
      currency,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      transactionId: paymentIntent.charges.data[0]?.id || '',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing',
      purpose,
      metadata,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: paymentIntent.status === 'succeeded' ?
        admin.firestore.FieldValue.serverTimestamp() : null,
      failureReason: '',
      refundAmount: 0,
      refundedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await paymentRef.set(paymentData);

    // Send payment notification
    await db.collection('notifications').add({
      userId,
      type: 'payment_update',
      title: 'Payment Processed',
      body: `Payment of ${currency} ${amount} has been ${paymentData.status}`,
      actionUrl: '/payments/' + paymentRef.id,
      channelType: ['email', 'push'],
      relatedEntityType: 'payment',
      relatedEntityId: paymentRef.id,
      isRead: false,
      priority: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      paymentId: paymentRef.id,
      status: paymentData.status,
      transactionId: paymentData.transactionId,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Stripe webhook handler for payment events
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handlePaymentSuccess(paymentIntent) {
  // Update payment record
  const payments = await db.collection('payments')
    .where('stripePaymentIntentId', '==', paymentIntent.id)
    .get();

  if (!payments.empty) {
    await payments.docs[0].ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function handlePaymentFailure(paymentIntent) {
  // Update payment record
  const payments = await db.collection('payments')
    .where('stripePaymentIntentId', '==', paymentIntent.id)
    .get();

  if (!payments.empty) {
    await payments.docs[0].ref.update({
      status: 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
    });
  }
}

async function handleRefund(charge) {
  // Find payment and update refund status
  const payments = await db.collection('payments')
    .where('transactionId', '==', charge.id)
    .get();

  if (!payments.empty) {
    const payment = payments.docs[0].data();
    await payments.docs[0].ref.update({
      status: 'refunded',
      refundAmount: charge.amount_refunded / 100,
      refundedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Process refund
exports.refundPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || context.auth.token.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can process refunds');
    }

    const { paymentId, refundAmount } = data;

    // Get payment
    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const payment = paymentDoc.data();

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round((refundAmount || payment.amount) * 100)
    });

    // Update payment record
    await paymentDoc.ref.update({
      status: 'refunded',
      refundAmount: refund.amount / 100,
      refundedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      message: 'Refund processed successfully'
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * NOTIFICATION HANDLING
 */

// Send notification via multiple channels
exports.sendNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, type, channels } = data;

    if (!userId || !title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required notification fields');
    }

    // Get user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const defaultChannels = channels || ['push', 'email'];

    // Send via different channels
    const results = {};

    if (defaultChannels.includes('push')) {
      results.push = await sendPushNotification(userId, title, body);
    }

    if (defaultChannels.includes('email')) {
      results.email = await sendEmailNotification(user.email, title, body);
    }

    if (defaultChannels.includes('sms')) {
      results.sms = await sendSMSNotification(user.phoneNumber, body);
    }

    if (defaultChannels.includes('whatsapp')) {
      results.whatsapp = await sendWhatsAppNotification(user.phoneNumber, body);
    }

    // Store notification in database
    await db.collection('notifications').add({
      userId,
      type: type || 'system',
      title,
      body,
      channelType: defaultChannels,
      isRead: false,
      deliveryStatus: results,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: 'Notification sent successfully',
      results
    };
  } catch (error) {
    console.error('Notification sending error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send push notification via FCM
async function sendPushNotification(userId, title, body) {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmTokens = userDoc.data()?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log('No FCM tokens found for user:', userId);
      return { status: 'no_tokens' };
    }

    const message = {
      notification: { title, body },
      tokens: fcmTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    return { status: 'sent', successCount: response.successCount };
  } catch (error) {
    console.error('Push notification error:', error);
    return { status: 'failed', error: error.message };
  }
}

// Send email notification
async function sendEmailNotification(email, title, body) {
  try {
    // Use SendGrid or similar email service
    // This is a placeholder
    console.log(`Email sent to ${email}: ${title}`);
    return { status: 'sent', email };
  } catch (error) {
    console.error('Email notification error:', error);
    return { status: 'failed', error: error.message };
  }
}

// Send SMS notification via Twilio
async function sendSMSNotification(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      return { status: 'no_phone' };
    }

    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return { status: 'sent', phoneNumber };
  } catch (error) {
    console.error('SMS notification error:', error);
    return { status: 'failed', error: error.message };
  }
}

// Send WhatsApp notification via Twilio
async function sendWhatsAppNotification(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      return { status: 'no_phone' };
    }

    await twilio.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`
    });

    return { status: 'sent', phoneNumber };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { status: 'failed', error: error.message };
  }
}

module.exports = exports;
