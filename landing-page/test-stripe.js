// Simple Stripe test script
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Check if API key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

console.log('Stripe key available:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
});

// Test by listing products
async function testStripe() {
  try {
    console.log('Testing Stripe API connection...');
    const products = await stripe.products.list({ limit: 1 });
    console.log('Connection successful! Found products:', products.data.length);
    
    // List prices for the test product
    if (products.data.length > 0) {
      const productId = 'prod_SBCchZLRN3MWbu'; // Your test product ID
      const prices = await stripe.prices.list({ product: productId });
      console.log('Prices for product:', prices.data.map(p => ({
        id: p.id,
        amount: p.unit_amount / 100,
        currency: p.currency
      })));
    }
  } catch (error) {
    console.error('Error connecting to Stripe:', error);
  }
}

// Run the test
testStripe(); 