import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the OAuth callback
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      // Check if there are subscription parameters stored from the login page
      const storedParams = sessionStorage.getItem('subscriptionParams');
      let returnPath = '/';
      
      // If we have subscription params, direct to checkout with those params
      if (storedParams) {
        const subscriptionParams = JSON.parse(storedParams);
        
        if (subscriptionParams && subscriptionParams.planId) {
          const params = new URLSearchParams();
          Object.keys(subscriptionParams).forEach(key => {
            params.append(key, subscriptionParams[key]);
          });
          returnPath = `/checkout?${params.toString()}`;
        }
        
        // We don't clear the stored params here to ensure they're available
        // when the user gets redirected to the checkout page
      }
      
      // Redirect to the appropriate page
      navigate(returnPath, { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 