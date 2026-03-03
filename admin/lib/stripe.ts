import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export async function getStripeCustomer(customerId: string) {
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw error;
  }
}

export async function createStripeCustomer(email: string, name: string) {
  try {
    return await stripe.customers.create({
      email,
      name,
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export async function getStripeSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    throw error;
  }
}

export async function listStripeTransactions(customerId: string) {
  try {
    return await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
  } catch (error) {
    console.error('Error listing Stripe transactions:', error);
    throw error;
  }
}

export async function refundStripeCharge(chargeId: string, amount?: number) {
  try {
    return await stripe.refunds.create({
      charge: chargeId,
      ...(amount && { amount }),
    });
  } catch (error) {
    console.error('Error refunding Stripe charge:', error);
    throw error;
  }
}
