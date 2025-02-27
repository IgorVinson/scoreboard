import React, { createContext, useContext } from 'react';
import { useAuth } from './auth-context';
import { useData } from './data-context';

interface SoloModeContextType {
  isSoloMode: boolean;
  isVirtualManager: boolean;
  // Function to toggle between regular user and virtual manager in solo mode
  toggleVirtualManager: () => void;
}

const SoloModeContext = createContext<SoloModeContextType>(
  {} as SoloModeContextType
);

export const useSoloMode = () => useContext(SoloModeContext);

export const SoloModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { getUserById, updateUser } = useData();
  const currentUser = getUserById(user?.id || '');

  // Check if user is in solo mode
  const isSoloMode = currentUser?.mode === 'SOLO';

  // Use local storage to remember if the user is acting as a virtual manager in solo mode
  const [isVirtualManager, setIsVirtualManager] = React.useState(() => {
    if (!isSoloMode) return false;
    const stored = localStorage.getItem(`virtual_manager_${user?.id}`);
    return stored === 'true';
  });

  // Toggle between regular user and virtual manager in solo mode
  const toggleVirtualManager = () => {
    if (!isSoloMode) return;

    const newValue = !isVirtualManager;
    setIsVirtualManager(newValue);
    localStorage.setItem(`virtual_manager_${user?.id}`, newValue.toString());
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
