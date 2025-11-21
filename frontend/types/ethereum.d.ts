// Ethereum provider type declarations
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    selectedAddress: string | null;
    chainId: string | null;
  };
}

declare global {
  interface WindowEventMap {
    'ethereum#initialized': CustomEvent;
  }
}

export {};

