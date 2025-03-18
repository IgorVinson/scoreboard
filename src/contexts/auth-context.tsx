import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';
import { supabase } from '../lib/supabase';
import { syncAuthUserToLocalStorage } from '@/lib/local-storage';
import { generateSampleData } from '@/lib/sample-data';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Add other auth methods
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simplified auth setup
  useEffect(() => {
    console.log('Setting up auth state management');
    
    // One-time session check
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        console.log('Initial session check:', data.session ? 'Logged in' : 'Not logged in');
        
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || '',
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
          });
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      console.log('Cleaning up auth subscriptions');
      subscription?.unsubscribe();
    };
  }, []);
  
  // Simplified sign in method
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
  };
  
  // Simplified sign out method
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  
  const value = {
    user,
    loading,
    signIn,
    signOut,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="auth-loading">Loading authentication...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
