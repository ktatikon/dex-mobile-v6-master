interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: RequestArguments) => Promise<unknown>;
  on: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: {
    toString: () => string;
  };
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: unknown) => Promise<any>;
  signAllTransactions: (transactions: unknown[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    solana?: PhantomProvider;
  }
}
