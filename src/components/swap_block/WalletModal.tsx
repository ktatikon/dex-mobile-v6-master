/**
 * ENHANCED WALLET MODAL - MODULAR ARCHITECTURE
 * 
 * Comprehensive wallet connection and fiat integration modal.
 * Supports crypto wallets, fiat payment methods, and enterprise services.
 * Built with PhonePe, PayPal, UPI, and banking API integrations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Building, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { enterpriseServiceIntegrator } from '@/services/enterpriseServiceIntegrator';
import { blockchainService } from '@/services/blockchainService';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';

// Types for component props
export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnect?: (wallet: WalletConnection) => void;
  onFiatConnect?: (fiatMethod: FiatConnection) => void;
  className?: string;
}

// Wallet connection interface
export interface WalletConnection {
  type: 'crypto';
  provider: string;
  address: string;
  chainId: number;
  balance: string;
}

// Fiat connection interface
export interface FiatConnection {
  type: 'fiat';
  provider: 'phonepe' | 'paypal' | 'upi' | 'banking';
  accountId: string;
  currency: string;
  balance: number;
  verified: boolean;
}

// Supported crypto wallets
const CRYPTO_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask browser extension',
    popular: true
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect using WalletConnect protocol',
    popular: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect using Coinbase Wallet',
    popular: false
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Connect using Trust Wallet',
    popular: false
  }
];

// Supported fiat payment methods
const FIAT_METHODS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: '📱',
    description: 'UPI payments via PhonePe',
    currencies: ['INR'],
    popular: true,
    region: 'India'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    description: 'Global payments via PayPal',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    popular: true,
    region: 'Global'
  },
  {
    id: 'upi',
    name: 'UPI Direct',
    icon: '🏦',
    description: 'Direct UPI payments',
    currencies: ['INR'],
    popular: true,
    region: 'India'
  },
  {
    id: 'banking',
    name: 'Bank Transfer',
    icon: '🏛️',
    description: 'Direct bank account transfer',
    currencies: ['INR', 'USD', 'EUR'],
    popular: false,
    region: 'Global'
  }
];

/**
 * Enhanced Wallet Modal Component
 * Comprehensive wallet and fiat payment integration
 */
export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onWalletConnect,
  onFiatConnect,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [connectedWallets, setConnectedWallets] = useState<WalletConnection[]>([]);
  const [connectedFiat, setConnectedFiat] = useState<FiatConnection[]>([]);
  const [error, setError] = useState<string>('');

  const componentId = 'wallet_modal';

  /**
   * Connect to crypto wallet
   */
  const connectCryptoWallet = useCallback(async (walletId: string) => {
    setIsConnecting(true);
    setError('');
    setConnectionStatus(`Connecting to ${walletId}...`);

    try {
      await loadingOrchestrator.startLoading(`${componentId}_${walletId}`, `Connecting to ${walletId}`);

      let connection: WalletConnection | null = null;

      switch (walletId) {
        case 'metamask':
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            const accounts = await (window as any).ethereum.request({
              method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
              const chainId = await (window as any).ethereum.request({
                method: 'eth_chainId'
              });
              
              // Initialize blockchain service with MetaMask
              const initResult = await blockchainService.initialize();
              if (initResult.success) {
                const balance = await blockchainService.getBalance();
                
                connection = {
                  type: 'crypto',
                  provider: 'metamask',
                  address: accounts[0],
                  chainId: parseInt(chainId, 16),
                  balance: balance || '0'
                };
              }
            }
          } else {
            throw new Error('MetaMask not installed');
          }
          break;

        case 'walletconnect':
          // WalletConnect integration would go here
          setConnectionStatus('WalletConnect integration coming soon...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          throw new Error('WalletConnect not yet implemented');

        case 'coinbase':
          // Coinbase Wallet integration would go here
          throw new Error('Coinbase Wallet not yet implemented');

        case 'trust':
          // Trust Wallet integration would go here
          throw new Error('Trust Wallet not yet implemented');

        default:
          throw new Error('Unsupported wallet');
      }

      if (connection) {
        setConnectedWallets(prev => [...prev, connection!]);
        if (onWalletConnect) {
          onWalletConnect(connection);
        }
        setConnectionStatus('Wallet connected successfully!');
        
        await loadingOrchestrator.completeLoading(`${componentId}_${walletId}`, 'Wallet connected successfully');
        
        // Auto-close after successful connection
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error(`Failed to connect to ${walletId}:`, error);
      setError(error.message || `Failed to connect to ${walletId}`);
      await loadingOrchestrator.failLoading(`${componentId}_${walletId}`, error.message);
    } finally {
      setIsConnecting(false);
      setTimeout(() => {
        setConnectionStatus('');
      }, 3000);
    }
  }, [onWalletConnect, onClose]);

  /**
   * Connect to fiat payment method
   */
  const connectFiatMethod = useCallback(async (methodId: string) => {
    setIsConnecting(true);
    setError('');
    setConnectionStatus(`Connecting to ${methodId}...`);

    try {
      await loadingOrchestrator.startLoading(`${componentId}_fiat_${methodId}`, `Connecting to ${methodId}`);

      if (!enterpriseServiceIntegrator.isServiceInitialized()) {
        await enterpriseServiceIntegrator.initialize({
          enableFiatWallet: true,
          enableMEVProtection: false,
          enableGasOptimization: false,
          enableMFA: false,
          enableKYCAML: false,
          enableTDSCompliance: true,
          autoInitialize: true,
          fallbackMode: true
        });
      }

      const fiatWalletService = enterpriseServiceIntegrator.getFiatWalletService();
      let connection: FiatConnection | null = null;

      switch (methodId) {
        case 'phonepe': {
          setConnectionStatus('Redirecting to PhonePe...');
          const phonePeResult = await fiatWalletService.connectPhonePe({
            redirectUrl: window.location.href,
            merchantId: 'DEX_MOBILE_V6',
            amount: 0 // For connection only
          });
          
          if (phonePeResult.success) {
            connection = {
              type: 'fiat',
              provider: 'phonepe',
              accountId: phonePeResult.accountId || 'phonepe_user',
              currency: 'INR',
              balance: phonePeResult.balance || 0,
              verified: phonePeResult.verified || false
            };
          }
          break;
        }

        case 'paypal': {
          setConnectionStatus('Redirecting to PayPal...');
          const paypalResult = await fiatWalletService.connectPayPal({
            clientId: 'paypal_client_id',
            environment: 'sandbox', // Use 'live' for production
            currency: 'USD'
          });
          
          if (paypalResult.success) {
            connection = {
              type: 'fiat',
              provider: 'paypal',
              accountId: paypalResult.accountId || 'paypal_user',
              currency: 'USD',
              balance: paypalResult.balance || 0,
              verified: paypalResult.verified || false
            };
          }
          break;
        }

        case 'upi': {
          setConnectionStatus('Setting up UPI connection...');
          const upiResult = await fiatWalletService.connectUPI({
            vpa: 'user@upi', // This would be collected from user input
            bankAccount: 'user_bank_account'
          });
          
          if (upiResult.success) {
            connection = {
              type: 'fiat',
              provider: 'upi',
              accountId: upiResult.accountId || 'upi_user',
              currency: 'INR',
              balance: upiResult.balance || 0,
              verified: upiResult.verified || false
            };
          }
          break;
        }

        case 'banking': {
          setConnectionStatus('Setting up bank connection...');
          const bankingResult = await fiatWalletService.connectBankAccount({
            accountNumber: 'user_account',
            routingNumber: 'routing_number',
            accountType: 'checking',
            currency: 'USD'
          });
          
          if (bankingResult.success) {
            connection = {
              type: 'fiat',
              provider: 'banking',
              accountId: bankingResult.accountId || 'bank_user',
              currency: 'USD',
              balance: bankingResult.balance || 0,
              verified: bankingResult.verified || false
            };
          }
          break;
        }

        default:
          throw new Error('Unsupported payment method');
      }

      if (connection) {
        setConnectedFiat(prev => [...prev, connection!]);
        if (onFiatConnect) {
          onFiatConnect(connection);
        }
        setConnectionStatus('Payment method connected successfully!');
        
        await loadingOrchestrator.completeLoading(`${componentId}_fiat_${methodId}`, 'Payment method connected');
        
        // Auto-close after successful connection
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error(`Failed to connect to ${methodId}:`, error);
      setError(error.message || `Failed to connect to ${methodId}`);
      await loadingOrchestrator.failLoading(`${componentId}_fiat_${methodId}`, error.message);
    } finally {
      setIsConnecting(false);
      setTimeout(() => {
        setConnectionStatus('');
      }, 3000);
    }
  }, [onFiatConnect, onClose]);

  /**
   * Load existing connections
   */
  const loadExistingConnections = useCallback(async () => {
    try {
      // Check for existing crypto wallet connections
      if (blockchainService.isServiceInitialized()) {
        const address = await blockchainService.getWalletAddress();
        const balance = await blockchainService.getBalance();
        
        if (address) {
          const existingWallet: WalletConnection = {
            type: 'crypto',
            provider: 'metamask', // Assume MetaMask for now
            address,
            chainId: 1, // Ethereum mainnet
            balance: balance || '0'
          };
          setConnectedWallets([existingWallet]);
        }
      }

      // Check for existing fiat connections
      if (enterpriseServiceIntegrator.isServiceInitialized()) {
        const fiatWalletService = enterpriseServiceIntegrator.getFiatWalletService();
        const fiatConnections = await fiatWalletService.getConnectedAccounts();
        
        if (fiatConnections && fiatConnections.length > 0) {
          setConnectedFiat(fiatConnections);
        }
      }
    } catch (error) {
      console.error('Failed to load existing connections:', error);
    }
  }, []);

  // Load existing connections when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingConnections();
    }
  }, [isOpen, loadExistingConnections]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-gray-600 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#B1420A]" />
            Connect Wallet & Payment
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#2C2C2E] rounded-lg p-1">
          <Button
            variant={activeTab === 'crypto' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 text-sm ${
              activeTab === 'crypto' 
                ? 'bg-[#B1420A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Crypto Wallets
          </Button>
          <Button
            variant={activeTab === 'fiat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('fiat')}
            className={`flex-1 text-sm ${
              activeTab === 'fiat' 
                ? 'bg-[#B1420A] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Fiat Payments
          </Button>
        </div>

        {/* Connection Status */}
        {(connectionStatus || error) && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            error ? 'bg-red-900/20 border border-red-500/30' : 'bg-blue-900/20 border border-blue-500/30'
          }`}>
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : error ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            <span className={`text-sm ${error ? 'text-red-400' : 'text-blue-400'}`}>
              {error || connectionStatus}
            </span>
          </div>
        )}

        {/* Crypto Wallets Tab */}
        {activeTab === 'crypto' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-4">
              Connect your crypto wallet to start trading
            </div>
            
            {CRYPTO_WALLETS.map((wallet) => (
              <Button
                key={wallet.id}
                onClick={() => connectCryptoWallet(wallet.id)}
                disabled={isConnecting}
                variant="outline"
                className="w-full p-4 h-auto border-gray-600 hover:border-[#B1420A] text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{wallet.name}</span>
                      {wallet.popular && (
                        <span className="text-xs bg-[#B1420A] text-white px-2 py-1 rounded">Popular</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{wallet.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </Button>
            ))}

            {/* Connected Wallets */}
            {connectedWallets.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400 mb-3">Connected Wallets</div>
                {connectedWallets.map((wallet, index) => (
                  <div key={index} className="bg-[#2C2C2E] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">{wallet.provider}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Balance: {parseFloat(wallet.balance).toFixed(4)} ETH
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fiat Payments Tab */}
        {activeTab === 'fiat' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-4">
              Connect fiat payment methods for easy funding
            </div>
            
            {FIAT_METHODS.map((method) => (
              <Button
                key={method.id}
                onClick={() => connectFiatMethod(method.id)}
                disabled={isConnecting}
                variant="outline"
                className="w-full p-4 h-auto border-gray-600 hover:border-[#B1420A] text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{method.name}</span>
                      {method.popular && (
                        <span className="text-xs bg-[#B1420A] text-white px-2 py-1 rounded">Popular</span>
                      )}
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">{method.region}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{method.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: {method.currencies.join(', ')}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </Button>
            ))}

            {/* Connected Fiat Methods */}
            {connectedFiat.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400 mb-3">Connected Payment Methods</div>
                {connectedFiat.map((fiat, index) => (
                  <div key={index} className="bg-[#2C2C2E] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">{fiat.provider}</span>
                      {fiat.verified && (
                        <Shield className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Account: {fiat.accountId}
                    </div>
                    <div className="text-xs text-gray-400">
                      Balance: {fiat.balance.toFixed(2)} {fiat.currency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:text-white"
            disabled={isConnecting}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
