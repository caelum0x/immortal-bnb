'use client'

import { useState, createContext, useContext } from 'react'

// Simple context for now - we'll add React Query later
const AppContext = createContext<{
  botStatus: string;
  setBotStatus: (status: string) => void;
}>({
  botStatus: 'disconnected',
  setBotStatus: () => {},
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [botStatus, setBotStatus] = useState('disconnected');

  return (
    <AppContext.Provider value={{ botStatus, setBotStatus }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext);
