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
      if (typeof window === 'undefined') return;
      
      console.log('🔍 Checking for existing wallet connection...');
      
      if (!window.ethereum) {
        console.log('⚠️  No wallet detected');
        return;
      }
      
      console.log('✅ Wallet detected:', {
        isMetaMask: window.ethereum.isMetaMask,
      });
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('📋 Existing accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          console.log('✅ Auto-connected to:', accounts[0]);
          await updateWalletInfo(accounts[0]);
        } else {
          console.log('ℹ️  No existing connection');
        }
      } catch (error) {
        console.error('❌ Failed to check wallet connection:', error);
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
    console.log('🔌 Connect wallet button clicked');
    
    // Check if window.ethereum exists
    if (typeof window === 'undefined') {
      setError('This function must be called in a browser environment.');
      console.error('❌ window is undefined');
      return;
    }

    if (!window.ethereum) {
      const errorMsg = 'No Ethereum wallet found. Please install MetaMask or another Web3 wallet.';
      setError(errorMsg);
      console.error('❌', errorMsg);
      alert(errorMsg + '\n\nDownload MetaMask: https://metamask.io/');
      return;
    }

    console.log('✅ window.ethereum found:', {
      isMetaMask: window.ethereum.isMetaMask,
      selectedAddress: window.ethereum.selectedAddress,
    });

    setIsConnecting(true);
    setError(null);

    try {
      console.log('📡 Requesting accounts...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('✅ Accounts received:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        console.log('✅ Wallet connected:', accounts[0]);
        await updateWalletInfo(accounts[0]);
      } else {
        const errorMsg = 'No accounts returned from wallet.';
        setError(errorMsg);
        console.error('❌', errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Wallet connection error:', error);
      
      if (error.code === 4001) {
        setError('Connection rejected by user. Please try again and approve the connection.');
      } else if (error.code === -32002) {
        setError('Connection request already pending. Please check your wallet.');
      } else if (error.message) {
        setError(`Connection failed: ${error.message}`);
      } else {
        setError('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
      }
      
      // Show alert for better visibility
      alert(`Wallet Connection Error:\n\n${error.message || 'Unknown error'}\n\nPlease make sure:\n1. MetaMask is installed\n2. MetaMask is unlocked\n3. You approve the connection request`);
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
