import {Platform} from 'react-native';
import {createClient} from '@supabase/supabase-js';

// Custom storage implementation that handles all environments
const createCustomStorage = () => {
  const isServer = typeof window === 'undefined';
  const isNative = Platform.OS !== 'web';

  if (isServer) {
    // Server-side storage implementation (non-persistent)
    return {
      getItem: async (key: string) => null,
      setItem: async (key: string, value: string) => {},
      removeItem: async (key: string) => {},
    };
  }

  if (isNative) {
    // React Native storage implementation
    return require('@react-native-async-storage/async-storage').default;
  }

  // Web storage implementation
  return {
    getItem: async (key: string) => window.localStorage.getItem(key),
    setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: async (key: string) => window.localStorage.removeItem(key),
  };
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});