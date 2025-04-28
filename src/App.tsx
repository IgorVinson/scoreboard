import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from '@/components/dashboard';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { SoloModeProvider } from '@/contexts/solo-mode-context';
import { AuthPage } from '@/components/auth/auth-page';
import { supabase } from '@/lib/supabase';
import { SubscriptionModal } from '@/components/subscription-modal';

// Import our pages
import Login from '@/pages/login';
import Checkout from '@/pages/checkout';
import PaymentSuccess from '@/pages/payment-success';
import AuthCallback from '@/pages/auth-callback';
import PaymentRedirect from '@/pages/payment-redirect';
import LandingPage from '@/pages/landing';
import SubscriptionPage from '@/pages/subscription';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const navigate = useNavigate();
  
  // console.log('ProtectedRoute - User:', user?.id, 'Loading:', loading);
  
  useEffect(() => {
    // Add a short delay to ensure auth state is properly checked
    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Check for subscription status when user is available
  useEffect(() => {
    console.log('Subscription check effect - User:', user?.id);
    if (!user) return;
    
    const checkSubscription = async () => {
      try {
        console.log('Checking subscription status for user:', user.id);
        // Query the user's subscription status from the database
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
        
        console.log('Subscription query result:', data, error);
        
        if (error) throw error;
        
        // Check if user has an active subscription
        const isSubscribed = data?.subscription_status === 'active' || 
                             data?.subscription_status === 'trialing';
        
        console.log('Is subscribed:', isSubscribed, 'Status:', data?.subscription_status);
        
        setHasSubscription(isSubscribed);
        
        // If not subscribed, store current path and show modal
        if (!isSubscribed) {
          console.log('User not subscribed, showing modal');
          sessionStorage.setItem('redirectAfterSubscription', window.location.pathname);
          setShowSubscriptionModal(true);
        }
        
        setCheckingSubscription(false);
      } catch (err) {
        console.error('Error checking subscription status:', err);
        setCheckingSubscription(false);
      }
    };
    
    checkSubscription();
  }, [user]);

  // Show loading while checking authentication or subscription
  if (loading || checkingAuth || (user && checkingSubscription)) {
    console.log('Showing loading spinner - loading:', loading, 'checkingAuth:', checkingAuth, 'checkingSubscription:', checkingSubscription);
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If user has subscription or we're showing the modal, render children with modal if needed
  console.log('Rendering content - showSubscriptionModal:', showSubscriptionModal, 'hasSubscription:', hasSubscription);
  return (
    <>
      {children}
      {showSubscriptionModal && (
        <SubscriptionModal 
          open={showSubscriptionModal}
          onOpenChange={(isOpen: boolean) => {
            console.log('Modal open state changing to:', isOpen);
            setShowSubscriptionModal(isOpen);
          }}
        />
      )}
    </>
  );
}

function AppContent() {
  useEffect(() => {
    // Attempt to restore session on mount
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        if (expiresAt < now) {
          // Session has expired, sign out
          await supabase.auth.signOut();
        }
      }
    };

    restoreSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/payment-redirect" element={<PaymentRedirect />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        
        <Route path="/payment-success" element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme='system' storageKey='ui-theme'>
      <AuthProvider>
        <DataProvider>
          <SoloModeProvider>
            <AppContent />
            <Toaster />
          </SoloModeProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
