import { createCheckoutSession, CreateCheckoutSessionParams } from '@/lib/stripe';

/**
 * Creates a Stripe checkout session for subscription
 */
export async function createCheckoutSessionHandler(params: CreateCheckoutSessionParams) {
  try {
    const session = await createCheckoutSession(params);
    return {
      success: true,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 