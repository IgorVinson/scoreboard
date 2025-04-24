import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUpdate = useRef<number>(0);

  // Debounced session update to prevent rapid re-renders
  const updateSession = useCallback((newSession: Session | null) => {
    const now = Date.now();
    // Only update if more than 1 second has passed since last update
    if (now - lastUpdate.current > 1000) {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      lastUpdate.current = now;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        updateSession(session);
        setLoading(false);
      }
    });

    // Listen for auth changes with debounce
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        updateSession(session);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  // Configure session persistence with debounce
  const debouncedSetSession = useCallback(async () => {
    if (!session) return;
    
    const now = Date.now();
    if (now - lastUpdate.current > 1000) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      lastUpdate.current = now;
    }
  }, [session]);

  useEffect(() => {
    debouncedSetSession();
  }, [debouncedSetSession]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Configure session duration to 3 days
          sessionTime: 60 * 60 * 24 * 3, // 3 days in seconds
        },
      });

      if (signInError) throw signInError;

      // Explicitly update user and session state to ensure immediate update
      if (data && data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          // Configure session duration to 3 days
          sessionTime: 60 * 60 * 24 * 3, // 3 days in seconds
        },
      });

      if (signUpError) throw signUpError;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Configure session duration to 3 days
          sessionTime: 60 * 60 * 24 * 3, // 3 days in seconds
        },
      });

      if (error) throw error;
      
      // For OAuth providers, return the data object
      return data;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
