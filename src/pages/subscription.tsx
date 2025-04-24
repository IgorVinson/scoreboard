import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  // Get the redirect path from session storage if it exists
  useEffect(() => {
    const path = sessionStorage.getItem('redirectAfterSubscription');
    if (path) {
      setRedirectPath(path);
    }
  }, []);
  
  // Handle subscription flow - redirect to checkout with Starter plan
  const handleSubscribe = (planId: string, planName: string, planPrice: string) => {
    const params = new URLSearchParams();
    params.append('planId', planId);
    params.append('planName', planName);
    params.append('planPrice', planPrice);
    params.append('source', 'app_redirect');
    params.append('intent', 'subscribe');
    
    navigate(`/checkout?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-20">
        <div className="w-full max-w-3xl text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Subscription Required</h1>
          <p className="text-xl text-muted-foreground mb-6">
            To access this content, you need an active subscription.
            {redirectPath && (
              <span> You'll be redirected back to your original destination after subscribing.</span>
            )}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Starter Plan */}
          <div className="bg-card p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-2">Starter Plan</h2>
            <p className="text-3xl font-bold mb-4">$2.99<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Basic cloud integration
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Up to 5 team members
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                20GB storage
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('price_1RHCtKLHxokF8KKdJnmgS5yX', 'Starter', '2.99')}
            >
              Subscribe Now
            </Button>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-card border-primary border-2 p-8 rounded-xl shadow-md">
            <div className="bg-primary text-primary-foreground text-sm font-medium py-1 px-3 rounded-full w-fit mb-4">
              RECOMMENDED
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro Plan</h2>
            <p className="text-3xl font-bold mb-4">$3.99<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Advanced cloud integration
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Up to 20 team members
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                100GB storage
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Advanced analytics
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('price_1RHCtRLHxokF8KKdsoVVfhSC', 'Pro', '3.99')}
            >
              Subscribe Now
            </Button>
          </div>
        </div>
        
        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate('/login')}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
} 