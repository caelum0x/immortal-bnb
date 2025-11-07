'use client'

import { useState, createContext, useContext } from 'react'

// Simplified Web3 context for now
const Web3Context = createContext<{
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}>({
  isConnected: false,
  address: null,
  connect: async () => {},
  disconnect: () => {},
});

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        console.warn('No Ethereum wallet found');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
  };

  return (
    <Web3Context.Provider value={{ isConnected, address, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context);

declare global {
  interface Window {
    ethereum?: any;
  }
}
