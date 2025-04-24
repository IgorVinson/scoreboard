import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { tiers } from '../../landing-page/src/data/pricing';
import { IPricing } from '../../landing-page/src/types';
import { useAuth } from '@/contexts/auth-context';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { signOut } = useAuth();
  
  // Check if we've returned from Stripe
  const sessionId = searchParams.get('session_id');
  
  // If we have a session_id in the URL, redirect to payment success page
  useEffect(() => {
    if (sessionId) {
      // Immediately navigate to the payment success page
      navigate(`/payment-success?session_id=${sessionId}`, { replace: true });
    }
  }, [sessionId, navigate]);
  
  // Get the redirect path from session storage if it exists
  useEffect(() => {
    const path = sessionStorage.getItem('redirectAfterSubscription');
    if (path) {
      setRedirectPath(path);
    }
  }, []);
  
  // Handle redirection to login after modal closes
  useEffect(() => {
    if (!open && shouldRedirect) {
      // Reset the redirect flag
      setShouldRedirect(false);
      // Navigate to login
      signOut();
    }
  }, [open, shouldRedirect, navigate]);
  
  // Handle subscription flow - redirect to checkout
  const handleSubscribe = (tier: IPricing) => {
    const params = new URLSearchParams();
    if (tier.priceId) {
      params.append('planId', tier.priceId);
      params.append('planName', tier.name);
      params.append('planPrice', typeof tier.price === 'number' ? tier.price.toString() : '0');
      params.append('source', 'app_modal');
      params.append('intent', 'subscribe');
      
      // Store current path in session storage so payment-success.tsx can redirect back
      if (redirectPath) {
        sessionStorage.setItem('redirectAfterSubscription', redirectPath);
      } else {
        // If no redirect path is set, store the current location
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterSubscription', currentPath);
      }
      
      // Add current timestamp to prevent cache issues
      params.append('_', Date.now().toString());
      
      // Navigate to checkout page
      navigate(`/checkout?${params.toString()}`);
    } else if (tier.name === 'Enterprise') {
      // Handle Enterprise tier differently - could redirect to a contact form
      window.open('mailto:sales@yourcompany.com?subject=Enterprise Plan Inquiry', '_blank');
    }
  };
  
  // Custom onOpenChange handler
  const handleOpenChange = (newOpen: boolean) => {
    // Update the modal state first
    onOpenChange(newOpen);
    
    // If the modal is being closed, sign out and clear session data
    if (!newOpen) {
      // Clear all session data that might cause auto-login
      sessionStorage.removeItem('redirectAfterSubscription');
      sessionStorage.removeItem('subscriptionParams');
      
      // Small delay to ensure modal closes first
      setTimeout(() => {
        signOut();
      }, 100);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Subscription Required</DialogTitle>
          <DialogDescription className="text-center">
            To access this content, you need an active subscription.
            {redirectPath && (
              <span> You'll be redirected back to your original destination after subscribing.</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {tiers.map((tier, index) => (
            <div 
              key={tier.name} 
              className={`bg-card p-6 rounded-xl shadow-md border ${index === 1 ? 'border-primary border-2' : 'border-gray-200'}`}
            >
              {index === 1 && (
                <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full w-fit mb-2">
                  RECOMMENDED
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <p className="text-2xl font-bold mb-4">
                {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                {typeof tier.price === 'number' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </p>
              
              <ul className="space-y-2 mb-6">
                {tier.features.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={index === 1 ? "default" : "outline"}
                onClick={() => handleSubscribe(tier)}
              >
                {tier.name === 'Enterprise' ? 'Contact Us' : 'Subscribe Now'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 