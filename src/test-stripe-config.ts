/**
 * Test script to verify Stripe configuration
 * Run with: node -r dotenv/config dist/test-stripe-config.js
 * or: ts-node -r dotenv/config src/test-stripe-config.ts
 */

import Stripe from 'stripe';

// Helper function to get environment variables in both Node.js and Vite contexts
function getEnv(key: string): string | undefined {
  // Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
}

// Get the Stripe secret key
const STRIPE_SECRET_KEY = getEnv('VITE_STRIPE_SECRET_KEY');

// Check if the key is available
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: Stripe secret key is missing!');
  console.error('Make sure you have VITE_STRIPE_SECRET_KEY in your .env file');
  console.error('And that you are loading the .env file with dotenv');
  
  if (typeof process !== 'undefined') {
    console.error('Try running with: node -r dotenv/config ...');
  }
}

// Initialize Stripe with the secret key
let stripe: Stripe | null = null;
try {
  if (STRIPE_SECRET_KEY) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    });
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

async function testStripeConfig() {
  try {
    console.log('Testing Stripe configuration...');
    console.log('Stripe key available:', STRIPE_SECRET_KEY ? `${STRIPE_SECRET_KEY.substring(0, 7)}...` : 'Not found');
    
    if (!stripe) {
      throw new Error('Stripe client not initialized. Check your API key.');
    }
    
    // Try to retrieve products to test connection
    const products = await stripe.products.list({ limit: 1 });
    console.log('Successfully connected to Stripe!');
    console.log(`Found ${products.data.length} products`);
    
    // List price IDs (helpful for configuration)
    if (products.data.length > 0) {
      const productId = products.data[0].id;
      console.log(`First product ID: ${productId}`);
      
      const prices = await stripe.prices.list({ product: productId, limit: 5 });
      if (prices.data.length > 0) {
        console.log('Price IDs for this product:');
        prices.data.forEach(price => {
          const amount = price.unit_amount ? price.unit_amount / 100 : 'N/A';
          const recurring = price.recurring 
            ? `${price.recurring.interval} (${price.recurring.interval_count})` 
            : 'one-time';
          console.log(`- ${price.id} (${price.currency} ${amount}, ${recurring})`);
        });
      } else {
        console.log('No prices found for this product');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error testing Stripe configuration:');
    if (error instanceof Error) {
      console.error(`- ${error.message}`);
    } else {
      console.error(error);
    }
    return { success: false, error };
  }
}

// Only execute if running this file directly
if (typeof require !== 'undefined' && require.main === module) {
  testStripeConfig()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

export default testStripeConfig; 