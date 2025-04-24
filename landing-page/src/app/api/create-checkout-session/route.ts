import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Check if the API key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Updated to latest API version
});

// This function handles POST requests to /api/create-checkout-session
export async function POST(req: Request) {
  try {
    // Debug log to check if the API key is available
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    
    const body = await req.json();
    const { priceId, userId, userEmail } = body;

    console.log('Request body:', { priceId, userId, userEmail });

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#pricing`,
      // Pass the client reference id for tracking which user initiated the checkout
      client_reference_id: userId,
      // Use the customer email if provided, helps with pre-filling checkout form
      customer_email: userEmail,
    });

    console.log('Checkout session created:', session.id);
    
    // Return the session ID
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 