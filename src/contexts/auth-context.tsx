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
  
  // Function to ensure a user record exists in the database
  const ensureUserInDatabase = useCallback(async (authUser: User) => {
    if (!authUser || !authUser.id) {
      console.log('No auth user to create DB record for');
      return;
    }

    try {
      console.log('Checking if user exists in database:', authUser.id);
      
      // Check if user exists in database
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      // If user already exists, we're done
      if (!error && data) {
        console.log('User found in database, no action needed');
        return;
      }
      
      // If user doesn't exist, create them
      if (error && error.code === 'PGRST116') {
        console.log('User not found in database, creating new record');
        
        // Extract name from metadata
        const name = authUser.user_metadata?.name || 
                   authUser.user_metadata?.full_name || 
                   '';
                   
        // Create user record
        const { error: insertError, data: insertData } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: name
          })
          .select();
        
        if (insertError) {
          console.error('Error creating user record:', insertError);
          
          // Try a simplified insert as fallback
          const { error: simpleInsertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || 'no-email'
            });
            
          if (simpleInsertError) {
            console.error('Even simplified insert failed:', simpleInsertError);
          } else {
            console.log('Created basic user record with minimal fields');
          }
        } else {
          console.log('Successfully created user record:', insertData);
        }
      } else if (error) {
        console.error('Unexpected error checking user:', error);
      }
    } catch (e) {
      console.error('Exception in database user check:', e);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        updateSession(session);
        
        // Create database record if user is logged in
        if (session?.user) {
          ensureUserInDatabase(session.user)
            .catch(err => console.error('Failed to ensure user in DB:', err));
        }
        
        setLoading(false);
      }
    });

    // Listen for auth changes with debounce
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        updateSession(session);
        
        // Create database record when auth state changes
        if (session?.user) {
          ensureUserInDatabase(session.user)
            .catch(err => console.error('Failed to ensure user in DB on auth change:', err));
        }
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateSession, ensureUserInDatabase]);

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
        
        // Ensure database record exists
        await ensureUserInDatabase(data.user);
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
      
      // If signup created a user and auto-confirmed (like in development)
      if (data && data.user) {
        await ensureUserInDatabase(data.user);
      }
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
          redirectTo: `${window.location.origin}/auth-callback`,
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
