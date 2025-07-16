import { ethers } from 'ethers';
import { getNetworkConfig } from '@/contracts/addresses';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  networkName: string;
  isConnected: boolean;
}

export interface WalletProvider {
  name: string;
  icon: string;
  isInstalled: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
}

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust';

class WalletService {
  private currentWallet: WalletType | null = null;
  private walletInfo: WalletInfo | null = null;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private blockchainService: unknown = null;

  /**
   * Initialize wallet service with optional blockchain service injection
   */
  async initialize(blockchainSvc?: unknown): Promise<void> {
    try {
      // Use dependency injection to avoid circular imports
      if (blockchainSvc) {
        this.blockchainService = blockchainSvc;
      } else {
        // Lazy load blockchain service if not provided
        const { blockchainService } = await import('./blockchainService');
        this.blockchainService = blockchainService;
      }

      // Check if wallet was previously connected
      const savedWallet = localStorage.getItem('connectedWallet');
      if (savedWallet && this.isWalletInstalled(savedWallet as WalletType)) {
        await this.connectWallet(savedWallet as WalletType, false);
      }

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ Wallet service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize wallet service:', error);
    }
  }

  /**
   * Get available wallet providers
   */
  getAvailableWallets(): WalletProvider[] {
    return [
      {
        name: 'MetaMask',
        icon: '🦊',
        isInstalled: this.isWalletInstalled('metamask'),
        connect: () => this.connectWallet('metamask'),
        disconnect: () => this.disconnectWallet()
      },
      {
        name: 'WalletConnect',
        icon: '🔗',
        isInstalled: true, // Always available
        connect: () => this.connectWallet('walletconnect'),
        disconnect: () => this.disconnectWallet()
      },
      {
        name: 'Coinbase Wallet',
        icon: '🔵',
        isInstalled: this.isWalletInstalled('coinbase'),
        connect: () => this.connectWallet('coinbase'),
        disconnect: () => this.disconnectWallet()
      },
      {
        name: 'Trust Wallet',
        icon: '🛡️',
        isInstalled: this.isWalletInstalled('trust'),
        connect: () => this.connectWallet('trust'),
        disconnect: () => this.disconnectWallet()
      }
    ];
  }

  /**
   * Check if specific wallet is installed
   */
  private isWalletInstalled(walletType: WalletType): boolean {
    if (typeof window === 'undefined') return false;

    switch (walletType) {
      case 'metamask':
        return !!(window as unknown as { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask;
      case 'coinbase':
        return !!(window as unknown as { ethereum?: { isCoinbaseWallet?: boolean } }).ethereum?.isCoinbaseWallet;
      case 'trust':
        return !!(window as unknown as { ethereum?: { isTrust?: boolean } }).ethereum?.isTrust;
      case 'walletconnect':
        return true; // WalletConnect is always available via QR
      default:
        return false;
    }
  }

  /**
   * Connect to specific wallet
   */
  async connectWallet(walletType: WalletType, saveConnection: boolean = true): Promise<string> {
    try {
      let address: string;

      switch (walletType) {
        case 'metamask':
          address = await this.connectMetaMask();
          break;
        case 'walletconnect':
          address = await this.connectWalletConnect();
          break;
        case 'coinbase':
          address = await this.connectCoinbase();
          break;
        case 'trust':
          address = await this.connectTrust();
          break;
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Initialize blockchain service
      if (this.blockchainService && typeof this.blockchainService.connectWallet === 'function') {
        await this.blockchainService.connectWallet();
      }

      // Update wallet info
      await this.updateWalletInfo(address);

      // Save connection preference
      if (saveConnection) {
        localStorage.setItem('connectedWallet', walletType);
      }

      this.currentWallet = walletType;
      this.emit('walletConnected', { address, walletType });

      console.log(`✅ Connected to ${walletType}:`, address);
      return address;
    } catch (error) {
      console.error(`❌ Failed to connect ${walletType}:`, error);
      throw error;
    }
  }

  /**
   * Connect MetaMask
   */
  private async connectMetaMask(): Promise<string> {
    if (!window.ethereum?.isMetaMask) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  }

  /**
   * Connect WalletConnect (placeholder - requires WalletConnect SDK)
   */
  private async connectWalletConnect(): Promise<string> {
    // This would require WalletConnect v2 SDK integration
    // For now, we'll throw an error with instructions
    throw new Error('WalletConnect integration requires additional setup. Please use MetaMask for now.');
  }

  /**
   * Connect Coinbase Wallet
   */
  private async connectCoinbase(): Promise<string> {
    if (!window.ethereum?.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  }

  /**
   * Connect Trust Wallet
   */
  private async connectTrust(): Promise<string> {
    if (!window.ethereum?.isTrust) {
      throw new Error('Trust Wallet not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      this.currentWallet = null;
      this.walletInfo = null;
      
      // Clear saved connection
      localStorage.removeItem('connectedWallet');
      
      this.emit('walletDisconnected', {});
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet information
   */
  private async updateWalletInfo(address: string): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error('Ethereum provider not available');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);

      // Get network name
      const networkConfig = Object.values(getNetworkConfig('ethereum') ? 
        { ethereum: getNetworkConfig('ethereum') } : {})
        .find(config => config?.chainId === chainIdDecimal);

      // Get balance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      const balanceFormatted = ethers.utils.formatEther(balance);

      this.walletInfo = {
        address,
        balance: balanceFormatted,
        chainId: chainIdDecimal,
        networkName: networkConfig?.name || 'Unknown',
        isConnected: true
      };

      this.emit('walletInfoUpdated', this.walletInfo);
    } catch (error) {
      console.error('❌ Failed to update wallet info:', error);
    }
  }

  /**
   * Setup event listeners for wallet events
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.updateWalletInfo(accounts[0]);
        this.emit('accountChanged', accounts[0]);
      }
    });

    // Chain changed
    window.ethereum.on('chainChanged', (chainId: string) => {
      const chainIdDecimal = parseInt(chainId, 16);
      this.emit('chainChanged', chainIdDecimal);
      
      if (this.walletInfo) {
        this.updateWalletInfo(this.walletInfo.address);
      }
    });

    // Disconnect
    window.ethereum.on('disconnect', () => {
      this.disconnectWallet();
    });
  }

  /**
   * Switch to specific network
   */
  async switchNetwork(networkId: string): Promise<void> {
    try {
      if (this.blockchainService && typeof this.blockchainService.switchNetwork === 'function') {
        await this.blockchainService.switchNetwork(networkId);
      }

      if (this.walletInfo) {
        await this.updateWalletInfo(this.walletInfo.address);
      }
    } catch (error) {
      console.error('❌ Failed to switch network:', error);
      throw error;
    }
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Get current wallet type
   */
  getCurrentWallet(): WalletType | null {
    return this.currentWallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.walletInfo?.isConnected || false;
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const walletService = new WalletService();
