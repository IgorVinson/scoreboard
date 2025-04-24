import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { getCheckoutSession, getSubscription } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  
  const sessionId = searchParams.get('session_id');
  
  // Get redirect path from session storage if it exists
  useEffect(() => {
    const path = sessionStorage.getItem('redirectAfterSubscription');
    if (path) {
      setRedirectPath(path);
      // Clear it so it's not used again
      sessionStorage.removeItem('redirectAfterSubscription');
    }
  }, []);
  
  useEffect(() => {
    // If no session ID, navigate to dashboard
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    
    const verifyPayment = async () => {
      try {
        // Get the checkout session from Stripe
        const session = await getCheckoutSession(sessionId);
        
        if (!session) {
          throw new Error('Payment session not found');
        }
        
        // Verify that the payment is complete
        if (session.payment_status !== 'paid') {
          throw new Error('Payment not complete');
        }
        
        // Get subscription details
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        
        if (!subscriptionId) {
          throw new Error('Subscription ID not found in session');
        }

        // Get full subscription details to access period end
        const subscription = await getSubscription(subscriptionId);
        
        // Calculate subscription end date from the current period end
        // Stripe returns timestamps in seconds, we need to convert to milliseconds
        const subscriptionEndsAt = new Date(subscription.current_period_end * 1000).toISOString();
        
        console.log('Subscription details:', {
          customerId,
          subscriptionId,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          subscriptionEndsAt
        });
        
        // Update user in database with subscription information
        const { error: updateError } = await supabase
          .from('users')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            subscription_ends_at: subscriptionEndsAt,
          })
          .eq('id', user.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // Success!
        setStatus('success');
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus('error');
      }
    };
    
    verifyPayment();
  }, [sessionId, user, navigate]);
  
  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying your payment...</h1>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600">
            Please wait while we verify your payment and activate your subscription.
          </p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Error</h1>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <p className="mb-6 text-gray-600">
            We had trouble verifying your payment. Please contact customer support with your payment reference.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
            <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="mb-6 text-gray-600">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(redirectPath)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {redirectPath === '/' ? 'Go to Dashboard' : 'Continue to Your Content'}
          </button>
        </div>
      </div>
    </div>
  );
} 