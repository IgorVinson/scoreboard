import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the OAuth callback
    const handleCallback = async () => {
      // Get session data after OAuth
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        navigate('/login', { replace: true });
        return;
      }
      
      if (session?.user) {
        // Make sure the user exists in the database
        await ensureUserInDatabase(session.user);
      }
      
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
    
    // Function to ensure the user record exists in the database
    const ensureUserInDatabase = async (authUser: any) => {
      if (!authUser) return;
      
      try {
        console.log('Checking if user exists in database:', authUser.id);
        
        // Check if user exists in database
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single();
        
        // If no error, user exists
        if (!error && data) {
          console.log('User found in database:', data);
          return;
        }
        
        // If user doesn't exist, create them
        if (error) {
          console.log('User not found in database, creating new record');
          
          // Extract name from user metadata
          const name = authUser.user_metadata?.name || 
                     authUser.user_metadata?.full_name || 
                     '';
                     
          // Create user in database
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: name
            });
          
          if (insertError) {
            console.error('Error creating user in database:', insertError);
          } else {
            console.log('Successfully created user in database');
          }
        }
      } catch (error) {
        console.error('Error ensuring user exists in database:', error);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 