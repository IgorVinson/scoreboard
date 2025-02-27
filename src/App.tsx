import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from '@/components/dashboard';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { AuthPage } from '@/components/auth/auth-page';
import { supabase } from '@/lib/supabase';

function AppContent() {
  const { user, loading, session } = useAuth();

  useEffect(() => {
    // Attempt to restore session on mount
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AuthProvider>
        <DataProvider>
          <AppContent />
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;