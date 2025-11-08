'use client'

import { useState, createContext, useContext, useEffect } from 'react'

// Extended Web3 context for better wallet management
const Web3Context = createContext<{
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  network: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
}>({
  isConnected: false,
  address: null,
  isConnecting: false,
  error: null,
  network: null,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
});

// Declare ethereum property on window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            await updateWalletInfo(accounts[0]);
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Update wallet info (network and balance)
  const updateWalletInfo = async (walletAddress: string) => {
    if (!window.ethereum) return;
    
    try {
      // Get network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networks: Record<string, string> = {
        '0x1': 'Ethereum',
        '0x38': 'BNB Chain',
        '0xcc': 'opBNB Mainnet',
        '0x15eb': 'opBNB Testnet',
      };
      setNetwork(networks[chainId] || `Unknown (${chainId})`);

      // Get balance
      const balanceWei = await window.ethereum.request({ 
        method: 'eth_getBalance', 
        params: [walletAddress, 'latest'] 
      });
      const balanceEth = (parseInt(balanceWei, 16) / 1e18).toFixed(4);
      setBalance(balanceEth);
    } catch (error) {
      console.error('Failed to update wallet info:', error);
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await updateWalletInfo(accounts[0]);
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setError('Connection rejected by user.');
      } else {
        setError('Failed to connect wallet.');
      }
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setNetwork(null);
    setBalance(null);
    setError(null);
  };

  const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) {
      setError('No Ethereum wallet found.');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      
      // Update network info after switch
      if (address) {
        await updateWalletInfo(address);
      }
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to wallet
        setError('Please add this network to your wallet first.');
      } else {
        setError('Failed to switch network.');
      }
      console.error('Failed to switch network:', error);
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        updateWalletInfo(accounts[0]);
      } else {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      // Reload page on network change for simplicity
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ 
      isConnected, 
      address, 
      isConnecting, 
      error, 
      network, 
      balance, 
      connect, 
      disconnect, 
      switchNetwork 
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context);
