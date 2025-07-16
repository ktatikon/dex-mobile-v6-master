/**
 * ENTERPRISE WALLET ADDRESS SELECTOR - SENDER WALLET DROPDOWN
 * 
 * Comprehensive wallet address selector for sender wallets with enterprise features.
 * Supports MetaMask, WalletConnect, hardware wallets, and generated wallets.
 * Built with real blockchain integration and enterprise security standards.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, Copy, Wallet, Check, ExternalLink, Shield } from 'lucide-react';
import { walletService } from '@/services/walletService';
import { blockchainService } from '@/services/blockchainService';
import { enterpriseServiceIntegrator } from '@/services/enterpriseServiceIntegrator';

// Wallet address interface
export interface WalletAddress {
  address: string;
  type: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'generated' | 'hardware';
  name: string;
  balance: string;
  isConnected: boolean;
  icon: string;
  chainId?: number;
  networkName?: string;
}

// Component props
export interface WalletAddressSelectorProps {
  selectedAddress: WalletAddress | null;
  onAddressSelect: (address: WalletAddress) => void;
  tokenAddress?: string; // For balance calculation
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Enterprise Wallet Address Selector Component
 */
export const WalletAddressSelector: React.FC<WalletAddressSelectorProps> = ({
  selectedAddress,
  onAddressSelect,
  tokenAddress,
  label = 'From Wallet',
  className = '',
  disabled = false
}) => {
  // Component state
  const [isOpen, setIsOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  /**
   * Load available wallets from all sources
   */
  const loadAvailableWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const wallets: WalletAddress[] = [];

      // Get connected wallet from walletService
      const currentWalletInfo = walletService.getWalletInfo();
      const currentWalletType = walletService.getCurrentWallet();

      if (currentWalletInfo && currentWalletType) {
        wallets.push({
          address: currentWalletInfo.address,
          type: currentWalletType,
          name: getWalletDisplayName(currentWalletType),
          balance: currentWalletInfo.balance,
          isConnected: true,
          icon: getWalletIcon(currentWalletType),
          chainId: currentWalletInfo.chainId,
          networkName: currentWalletInfo.networkName
        });
      }

      // Get available wallet providers
      const availableProviders = walletService.getAvailableWallets();
      for (const provider of availableProviders) {
        if (provider.isInstalled && (!currentWalletType || provider.name.toLowerCase() !== currentWalletType)) {
          // Add as potential connection option
          wallets.push({
            address: '',
            type: getWalletTypeFromName(provider.name),
            name: provider.name,
            balance: '0',
            isConnected: false,
            icon: provider.icon
          });
        }
      }

      setAvailableWallets(wallets);

      // Set default selection to connected wallet
      if (wallets.length > 0 && !selectedAddress) {
        const connectedWallet = wallets.find(w => w.isConnected);
        if (connectedWallet) {
          onAddressSelect(connectedWallet);
        }
      }
    } catch (error) {
      console.error('❌ [WalletAddressSelector] Failed to load wallets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAddress, onAddressSelect]);

  /**
   * Load token balances for connected wallets
   */
  const loadTokenBalances = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const newBalances: Record<string, string> = {};
      
      for (const wallet of availableWallets) {
        if (wallet.isConnected && wallet.address) {
          try {
            const balance = await blockchainService.getTokenBalance(tokenAddress, wallet.address);
            newBalances[wallet.address] = balance;
          } catch (error) {
            console.warn(`Failed to get balance for ${wallet.address}:`, error);
            newBalances[wallet.address] = '0';
          }
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('❌ [WalletAddressSelector] Failed to load balances:', error);
    }
  }, [availableWallets, tokenAddress]);

  /**
   * Handle wallet connection
   */
  const handleWalletConnect = useCallback(async (walletType: string) => {
    try {
      setIsLoading(true);
      
      const provider = walletService.getAvailableWallets().find(
        p => p.name.toLowerCase() === walletType.toLowerCase()
      );
      
      if (provider) {
        let address = await provider.connect();
        await loadAvailableWallets(); // Refresh wallet list
        
        // Auto-select the newly connected wallet
        const connectedWallet = availableWallets.find(w => w.address === address);
        if (connectedWallet) {
          onAddressSelect(connectedWallet);
        }
      }
    } catch (error) {
      console.error('❌ [WalletAddressSelector] Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [availableWallets, onAddressSelect, loadAvailableWallets]);

  /**
   * Handle address copy
   */
  const handleCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }, []);

  /**
   * Format address for display
   */
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Load wallets on component mount
  useEffect(() => {
    loadAvailableWallets();
  }, [loadAvailableWallets]);

  // Load balances when token changes
  useEffect(() => {
    if (tokenAddress) {
      loadTokenBalances();
    }
  }, [tokenAddress, loadTokenBalances]);

  // Memoized display values
  const displayBalance = useMemo(() => {
    if (!selectedAddress?.address || !tokenAddress) return '';
    return balances[selectedAddress.address] || selectedAddress.balance || '0';
  }, [selectedAddress, tokenAddress, balances]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="text-sm font-medium text-gray-300 font-poppins">
        {label}
      </label>

      {/* Wallet Selector */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-[#2C2C2E] border-gray-600 hover:bg-[#3C3C3E] text-white"
            disabled={disabled || isLoading}
          >
            <div className="flex items-center gap-3">
              {selectedAddress ? (
                <>
                  <span className="text-lg">{selectedAddress.icon}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedAddress.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatAddress(selectedAddress.address)}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-gray-400">Select wallet...</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-[#1C1C1E] border-gray-600 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins">Select Sender Wallet</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {availableWallets.map((wallet, index) => (
              <Card
                key={`${wallet.type}-${index}`}
                className={`p-4 cursor-pointer transition-colors border-gray-600 ${
                  wallet.isConnected
                    ? 'bg-[#2C2C2E] hover:bg-[#3C3C3E]'
                    : 'bg-[#1C1C1E] hover:bg-[#2C2C2E] border-dashed'
                } ${
                  selectedAddress?.address === wallet.address
                    ? 'ring-2 ring-[#B1420A]'
                    : ''
                }`}
                onClick={() => {
                  if (wallet.isConnected) {
                    onAddressSelect(wallet);
                    setIsOpen(false);
                  } else {
                    handleWalletConnect(wallet.name);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{wallet.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium font-poppins">{wallet.name}</span>
                      {wallet.isConnected ? (
                        <span className="text-xs text-gray-400">
                          {formatAddress(wallet.address)}
                        </span>
                      ) : (
                        <span className="text-xs text-[#B1420A]">Click to connect</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {wallet.isConnected && (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {displayBalance} ETH
                          </div>
                          <div className="text-xs text-gray-400">
                            {wallet.networkName || 'Ethereum'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress(wallet.address);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {copiedAddress === wallet.address ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </>
                    )}
                    {wallet.isConnected && (
                      <Shield className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected wallet info */}
      {selectedAddress && selectedAddress.isConnected && (
        <div className="text-xs text-gray-400 font-poppins">
          Balance: {displayBalance} ETH • {selectedAddress.networkName || 'Ethereum'}
        </div>
      )}
    </div>
  );
};

// Helper functions
function getWalletDisplayName(type: string): string {
  const names: Record<string, string> = {
    metamask: 'MetaMask',
    walletconnect: 'WalletConnect',
    coinbase: 'Coinbase Wallet',
    trust: 'Trust Wallet',
    generated: 'Generated Wallet',
    hardware: 'Hardware Wallet'
  };
  return names[type] || type;
}

function getWalletIcon(type: string): string {
  const icons: Record<string, string> = {
    metamask: '🦊',
    walletconnect: '🔗',
    coinbase: '🔵',
    trust: '🛡️',
    generated: '⚡',
    hardware: '🔒'
  };
  return icons[type] || '💼';
}

function getWalletTypeFromName(name: string): unknown {
  const typeMap: Record<string, string> = {
    'MetaMask': 'metamask',
    'WalletConnect': 'walletconnect',
    'Coinbase Wallet': 'coinbase',
    'Trust Wallet': 'trust'
  };
  return typeMap[name] || 'metamask';
}

export default WalletAddressSelector;
