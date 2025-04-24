import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Extract all query parameters
  const searchParams = new URLSearchParams(location.search);
  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  // Store plan info in sessionStorage to persist through the OAuth flow
  useEffect(() => {
    if (searchParams.has('planId')) {
      // Store all query parameters to maintain them through the auth redirect
      sessionStorage.setItem('subscriptionParams', JSON.stringify(queryParams));
    }
  }, [location.search]);

  // Handle redirection after successful login
  useEffect(() => {
    if (user) {
      // First make sure the user record exists in the database
      ensureUserInDatabase(user)
        .then(() => {
          // Then determine where to redirect based on subscription status
          checkSubscriptionAndRedirect();
        })
        .catch(error => {
          console.error('Error ensuring user in database:', error);
          // Still try to redirect even if database check fails
          checkSubscriptionAndRedirect();
        });
    }
  }, [user]);
  
  // Function to ensure user exists in database
  const ensureUserInDatabase = async (authUser: any) => {
    if (!authUser) return;
    
    try {
      // Check if user exists in database
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      // If user exists, we're done
      if (!error && data) {
        console.log('User exists in database');
        return;
      }
      
      // If user doesn't exist, create them
      if (error) {
        console.log('Creating user record in database');
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || ''
          });
        
        if (insertError) {
          console.error('Failed to create user in database:', insertError);
        } else {
          console.log('Successfully created user in database');
        }
      }
    } catch (error) {
      console.error('Error checking user in database:', error);
    }
  };
  
  const checkSubscriptionAndRedirect = () => {
    // Get stored subscription parameters
    const storedParams = sessionStorage.getItem('subscriptionParams');
    const subscriptionParams = storedParams ? JSON.parse(storedParams) : null;
    
    // Calculate return path
    let returnPath = '/';
    
    // If we have subscription params, direct to checkout with those params
    if (subscriptionParams && subscriptionParams.planId) {
      const params = new URLSearchParams();
      Object.keys(subscriptionParams).forEach(key => {
        params.append(key, subscriptionParams[key]);
      });
      returnPath = `/checkout?${params.toString()}`;
      
      // Clear stored params now that we've used them
      sessionStorage.removeItem('subscriptionParams');
    }
    
    // Navigate to the appropriate page
    navigate(returnPath, { replace: true });
  };
  
  // If immediately logged in, don't render form
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      console.log('Sign in successful:', result);
      // Will redirect via useEffect when user updates
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Google OAuth will handle redirection
    } catch (error) {
      console.error('Google login failed:', error);
      setError('Failed to sign in with Google');
    }
  };

  // Determine display text based on URL parameters
  const isPlanSelected = searchParams.has('planId');
  const planName = searchParams.get('planName');
  const planPrice = searchParams.get('planPrice');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            {isPlanSelected 
              ? `Sign in to subscribe to ${planName || 'our service'} for $${planPrice || '3.99'}/month`
              : 'Enter your credentials to sign in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" disabled>
            Don't have an account? Contact administrator
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 