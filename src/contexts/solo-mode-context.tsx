import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './auth-context';
import { useData } from './data-context';

interface SoloModeContextType {
  isSoloMode: boolean;
  isVirtualManager: boolean;
  // Function to toggle between regular user and virtual manager in solo mode
  toggleVirtualManager: () => void;
}

const SoloModeContext = createContext<SoloModeContextType | null>(null);

export const useSoloMode = () => {
  const context = useContext(SoloModeContext);
  if (!context) {
    throw new Error('useSoloMode must be used within a SoloModeProvider');
  }
  return context;
};

export const SoloModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { getUserById, getUserPreference, setUserPreference } = useData();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVirtualManager, setIsVirtualManager] = useState(false);
  const lastFetch = useRef<number>(0);

  // Get user data with debounce
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) return;
      
      const now = Date.now();
      // Only fetch if more than 5 seconds have passed since last fetch
      if (now - lastFetch.current > 5000) {
        const userData = await getUserById(user.id);
        setCurrentUser(userData);
        lastFetch.current = now;
      }
    };
    
    fetchUser();
  }, [user, getUserById]);

  // Check if user is in solo mode
  const isSoloMode = currentUser?.mode === 'SOLO';

  // Load virtual manager preference from Supabase with debounce
  useEffect(() => {
    const loadVirtualManagerPref = async () => {
      if (!user || !isSoloMode) return;
      
      const now = Date.now();
      // Only fetch if more than 5 seconds have passed since last fetch
      if (now - lastFetch.current > 5000) {
        try {
          const pref = await getUserPreference('virtual_manager');
          if (pref) {
            setIsVirtualManager(pref.value === true);
          }
          lastFetch.current = now;
        } catch (error) {
          console.error('Error loading virtual manager preference:', error);
        }
      }
    };
    
    loadVirtualManagerPref();
  }, [user, isSoloMode, getUserPreference]);

  // Toggle between regular user and virtual manager in solo mode
  const toggleVirtualManager = async () => {
    if (!isSoloMode || !user) return;

    const newValue = !isVirtualManager;
    setIsVirtualManager(newValue);
    
    try {
      await setUserPreference('virtual_manager', newValue);
    } catch (error) {
      console.error('Error saving virtual manager preference:', error);
      // Revert UI if save fails
      setIsVirtualManager(!newValue);
    }
  };

  const value: SoloModeContextType = {
    isSoloMode,
    isVirtualManager,
    toggleVirtualManager,
  };

  return (
    <SoloModeContext.Provider value={value}>
      {children}
    </SoloModeContext.Provider>
  );
};
