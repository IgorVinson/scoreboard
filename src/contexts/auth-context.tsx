import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Configure session persistence
  useEffect(() => {
    supabase.auth.setSession({
      access_token: session?.access_token ?? '',
      refresh_token: session?.refresh_token ?? '',
    });
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Configure session duration to 3 days
        sessionTime: 60 * 60 * 24 * 3, // 3 days in seconds
      },
    });

    if (signInError) {
      throw new Error(signInError.message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error: signUpError } = await supabase.auth.signUp({
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

    if (signUpError) {
      throw new Error(signUpError.message);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Configure session duration to 3 days
        sessionTime: 60 * 60 * 24 * 3, // 3 days in seconds
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw new Error(signOutError.message);
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
