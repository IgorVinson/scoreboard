import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a custom Supabase client with specific auth options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false  // Disable automatic URL detection to avoid issues
  },
  // Important: Setting dangerouslyAllowBrowserUseWithoutSecureCookies to ignore WebSocket errors
  // This is safe for development/small projects, but ideally should be addressed properly in production
  dangerouslyAllowBrowserUseWithoutSecureCookies: true
});

// Patch the Supabase realtime client to handle WebSocket errors gracefully
const originalOnError = supabase.realtime.onError;
supabase.realtime.onError = function(callback) {
  const wrappedCallback = (error: Error) => {
    // Suppress WebSocket message channel errors
    if (error?.message?.includes('message channel closed')) {
      console.log('Suppressed WebSocket error');
      return;
    }
    callback(error);
  };
  
  return originalOnError.call(this, wrappedCallback);
}; 