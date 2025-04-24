import Stripe from 'stripe';

// Get the API key from environment variables
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY;

// Check if the key is available
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: Stripe secret key is missing. Make sure VITE_STRIPE_SECRET_KEY is set in your .env file.');
}

// Initialize Stripe with your secret key
const stripe = new Stripe(STRIPE_SECRET_KEY || 'dummy_key_for_initialization', {
  apiVersion: '2025-03-31.basil',
});

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail?: string;
}

/**
 * Creates a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
}: CreateCheckoutSessionParams) {
  // Verify that the API key is available before making any API calls
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured. Please check your environment variables.');
  }

  if (!priceId) {
    throw new Error('Price ID is required');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&timestamp=${Date.now()}`,
      cancel_url: `${window.location.origin}/`,
      // Pass the client reference id for tracking which user initiated the checkout
      client_reference_id: userId,
      // Use the customer email if provided, helps with pre-filling checkout form
      customer_email: userEmail,
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe Checkout Session
 */
export async function getCheckoutSession(sessionId: string) {
  // Verify that the API key is available before making any API calls
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured. Please check your environment variables.');
  }
  
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Creates or updates a Stripe customer for a user
 */
export async function createOrUpdateCustomer(userId: string, email: string, name?: string) {
  // Verify that the API key is available before making any API calls
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured. Please check your environment variables.');
  }
  
  try {
    // First, search for existing customer by metadata
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      // Update existing customer
      const customer = customers.data[0];
      return stripe.customers.update(customer.id, {
        email,
        name,
        metadata: {
          userId,
        },
      });
    } else {
      // Create new customer
      return stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });
    }
  } catch (error) {
    console.error('Error in createOrUpdateCustomer:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe subscription
 */
export async function getSubscription(subscriptionId: string) {
  // Verify that the API key is available before making any API calls
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key is not configured. Please check your environment variables.');
  }
  
  return stripe.subscriptions.retrieve(subscriptionId);
}

export default {
  createCheckoutSession,
  getCheckoutSession,
  createOrUpdateCustomer,
  getSubscription,
}; 