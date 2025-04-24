import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

export default function PaymentRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to payment page
        navigate('/checkout', { replace: true });
      } else {
        // User is not authenticated, redirect to login with return path
        const returnPath = encodeURIComponent('/checkout');
        navigate(`/login?returnTo=${returnPath}`, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 