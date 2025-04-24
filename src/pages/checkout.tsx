import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSessionHandler } from '@/api/createCheckoutSession';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

// Get the publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Check if the key is available
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('ERROR: Stripe publishable key is missing. Make sure VITE_STRIPE_PUBLISHABLE_KEY is set in your .env file.');
}

// Initialize Stripe outside of the component
// Using null as fallback if key is missing - we'll check before using
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Define proper types for createCheckoutSessionHandler params
interface CheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail: string;
  customFields?: Record<string, any>;
}

export default function Checkout() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  
  // Get all parameters related to the subscription
  const planId = searchParams.get('planId');
  const planName = searchParams.get('planName');
  const planPrice = searchParams.get('planPrice');
  const source = searchParams.get('source');
  const intent = searchParams.get('intent');
  
  // Fetch user subscription details from database
  useEffect(() => {
    const getUserSubscription = async () => {
      if (!user) return;
      
      try {
        // Query the user's subscription status from the database
        const { data, error } = await supabase
          .from('users')
          .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_ends_at')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setUserSubscription(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user subscription:', err);
        setError('Failed to load your subscription information');
        setLoading(false);
      }
    };
    
    getUserSubscription();
  }, [user]);
  
  // Create checkout session and redirect to Stripe
  const createAndRedirectToCheckout = async () => {
    try {
      setProcessingCheckout(true);
      
      // Store checkout intention in case of interruption
      sessionStorage.setItem('checkoutPlanId', planId || '');
      if (planName) sessionStorage.setItem('checkoutPlanName', planName);
      if (planPrice) sessionStorage.setItem('checkoutPlanPrice', planPrice);
      
      // Create a checkout session using our API handler with proper parameter handling
      const params: CheckoutSessionParams = {
        priceId: planId || '',
        userId: user?.id || '',
        userEmail: user?.email || '',
      };
      
      // Add custom fields if API supports them
      if (source || intent) {
        params.customFields = {
          source: source || 'direct',
          intent: intent || 'subscribe'
        };
      }
      
      const result = await createCheckoutSessionHandler(params);
      
      if (!result.success || !result.sessionId) {
        throw new Error(result.error || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }
      
      const { error: redirectError } = await stripe.redirectToCheckout({ 
        sessionId: result.sessionId 
      });
      
      if (redirectError) {
        throw redirectError;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setProcessingCheckout(false);
    }
  };
  
  useEffect(() => {
    // Don't proceed until loading is complete
    if (loading) return;
    
    // Redirect to dashboard if no plan ID or user
    if (!planId) {
      navigate('/');
      return;
    }
    
    if (!user) {
      // Save parameters and redirect to login
      const params = new URLSearchParams();
      if (planId) params.append('planId', planId);
      if (planName) params.append('planName', planName);
      if (planPrice) params.append('planPrice', planPrice);
      if (source) params.append('source', source);
      if (intent) params.append('intent', intent);
      
      navigate(`/login?${params.toString()}`);
      return;
    }
    
    // Check if user already has a subscription
    if (userSubscription) {
      const isSubscribed = userSubscription.subscription_status === 'active' || 
                          userSubscription.subscription_status === 'trialing';
      
      if (isSubscribed) {
        navigate('/');
        return;
      }
    }
    
    // Make sure Stripe is properly initialized
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Payment system is not properly configured. Please contact support.');
      return;
    }
    
    // Don't re-trigger checkout if already processing
    if (processingCheckout) return;
    
    // Initiate checkout process
    createAndRedirectToCheckout();
  }, [planId, user, navigate, loading, userSubscription, processingCheckout]);
  
  // After authentication, clear stored parameters from sessionStorage
  useEffect(() => {
    if (user && processingCheckout) {
      sessionStorage.removeItem('subscriptionParams');
    }
  }, [user, processingCheckout]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
          <p className="mb-6 text-muted-foreground">
            We encountered an error while setting up your payment. Please try again or contact support.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setError(null);
                setProcessingCheckout(false);
                
                // Try again with current parameters
                const params = new URLSearchParams();
                if (planId) params.append('planId', planId);
                if (planName) params.append('planName', planName);
                if (planPrice) params.append('planPrice', planPrice);
                if (source) params.append('source', source);
                if (intent) params.append('intent', intent);
                
                navigate(`/checkout?${params.toString()}`);
              }}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">
          {loading ? 'Checking Subscription Status' : 'Preparing Your Subscription'}
        </h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-muted-foreground">
          {loading 
            ? 'Checking your subscription status...'
            : `You'll be redirected to our secure payment provider to subscribe to ${planName || 'our service'} for $${planPrice || '3.99'}/month...`
          }
        </p>
      </div>
    </div>
  );
} 