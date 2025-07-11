import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, QrCode, Star, Clock, Plus, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addressBookService, type AddressBookEntry, type RecentAddress } from '@/services/addressBookService';
import { ensService, type ENSResolution } from '@/services/ensService';
import { QRScanner } from '@/components/QRScanner';

interface EnhancedAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  network: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAddressBook?: boolean;
  showRecentAddresses?: boolean;
  showENSResolution?: boolean;
  onAddressValidated?: (isValid: boolean, resolvedAddress?: string) => void;
}

export const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({
  value,
  onChange,
  network,
  placeholder = "Enter recipient address or ENS name",
  className = "",
  disabled = false,
  showAddressBook = true,
  showRecentAddresses = true,
  showENSResolution = true,
  onAddressValidated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>([]);
  const [ensResolution, setEnsResolution] = useState<ENSResolution | null>(null);
  const [isResolvingENS, setIsResolvingENS] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddToBook, setShowAddToBook] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isAddingToBook, setIsAddingToBook] = useState(false);

  // Load address book and recent addresses
  useEffect(() => {
    if (user?.id && showAddressBook) {
      loadAddressBook();
    }
    if (user?.id && showRecentAddresses) {
      loadRecentAddresses();
    }
  }, [user?.id, showAddressBook, showRecentAddresses]);

  // ENS resolution effect
  useEffect(() => {
    if (value && showENSResolution && ensService.isENSName(value)) {
      resolveENSName(value);
    } else {
      setEnsResolution(null);
    }
  }, [value, showENSResolution]);

  // Address validation effect
  useEffect(() => {
    const finalAddress = ensResolution?.address || value;
    const isValid = isValidAddress(finalAddress);
    onAddressValidated?.(isValid, ensResolution?.address || undefined);
  }, [value, ensResolution, onAddressValidated]);

  const loadAddressBook = useCallback(async () => {
    if (!user?.id) return;
    try {
      const entries = await addressBookService.getAddressBook(user.id);
      setAddressBook(entries.filter(entry => entry.network === network));
    } catch (error) {
      console.error('Error loading address book:', error);
    }
  }, [user?.id, network]);

  const loadRecentAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const recent = await addressBookService.getRecentAddresses(user.id, 5);
      setRecentAddresses(recent.filter(addr => addr.network === network));
    } catch (error) {
      console.error('Error loading recent addresses:', error);
    }
  }, [user?.id, network]);

  const resolveENSName = useCallback(async (ensName: string) => {
    setIsResolvingENS(true);
    try {
      const resolution = await ensService.resolveENSToAddress(ensName);
      setEnsResolution(resolution);
      
      if (resolution.isValid && resolution.address) {
        toast({
          title: "ENS Resolved",
          description: `${ensName} → ${formatAddress(resolution.address)}`,
          variant: "default",
        });
      } else if (resolution.error) {
        toast({
          title: "ENS Resolution Failed",
          description: resolution.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resolving ENS:', error);
    } finally {
      setIsResolvingENS(false);
    }
  }, [toast]);

  const isValidAddress = useCallback((address: string): boolean => {
    if (!address) return false;
    
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'polygon':
      case 'bsc':
      case 'arbitrum':
      case 'optimism':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
  }, [network]);

  const formatAddress = useCallback((address: string): string => {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const handleAddressSelect = useCallback(async (address: string) => {
    onChange(address);
    setShowDropdown(false);
    
    // Update usage tracking
    if (user?.id) {
      await addressBookService.updateAddressUsage(user.id, address, network);
      loadRecentAddresses();
    }
  }, [onChange, user?.id, network, loadRecentAddresses]);

  const handleAddToAddressBook = useCallback(async () => {
    if (!user?.id || !value || !newNickname.trim()) return;
    
    setIsAddingToBook(true);
    try {
      const finalAddress = ensResolution?.address || value;
      const result = await addressBookService.addAddress(
        user.id,
        finalAddress,
        newNickname.trim(),
        network,
        false
      );
      
      if (result.success) {
        toast({
          title: "Address Added",
          description: `${newNickname} added to address book`,
          variant: "default",
        });
        setNewNickname('');
        setShowAddToBook(false);
        loadAddressBook();
      } else {
        toast({
          title: "Failed to Add Address",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding to address book:', error);
      toast({
        title: "Error",
        description: "Failed to add address to address book",
        variant: "destructive",
      });
    } finally {
      setIsAddingToBook(false);
    }
  }, [user?.id, value, newNickname, ensResolution, network, toast, loadAddressBook]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Address copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [toast]);

  const finalAddress = ensResolution?.address || value;
  const isValid = isValidAddress(finalAddress);
  const showValidation = value.length > 0;

  return (
    <div className="relative">
      {/* Main Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled}
          className={`${className} ${
            showValidation
              ? isValid
                ? 'border-green-500 focus:border-green-500'
                : 'border-red-500 focus:border-red-500'
              : ''
          } pr-20`}
        />
        
        {/* Loading indicator for ENS resolution */}
        {isResolvingENS && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        )}
        
        {/* QR Scanner and Validation indicators */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* QR Scanner Button */}
          <QRScanner
            onScan={(address) => {
              onChange(address);
              setShowDropdown(false);
            }}
            disabled={disabled}
            className="text-gray-400 hover:text-white"
          />

          {/* Validation indicator */}
          {showValidation && (
            <div>
              {isValid ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <X size={16} className="text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ENS Resolution Display */}
      {ensResolution?.isValid && ensResolution.address && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">ENS</Badge>
              <span className="text-sm font-mono">{formatAddress(ensResolution.address)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(ensResolution.address!)}
              className="h-6 w-6 p-0"
            >
              <Copy size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Dropdown with address book and recent addresses */}
      {showDropdown && (showAddressBook || showRecentAddresses) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Address Book Section */}
          {showAddressBook && addressBook.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Star size={12} className="mr-1" />
                Address Book
              </div>
              {addressBook.slice(0, 5).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleAddressSelect(entry.address)}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">{entry.nickname}</div>
                    <div className="text-xs text-gray-500 font-mono">{formatAddress(entry.address)}</div>
                  </div>
                  {entry.is_favorite && <Star size={12} className="text-yellow-500 fill-current" />}
                </button>
              ))}
            </div>
          )}

          {/* Recent Addresses Section */}
          {showRecentAddresses && recentAddresses.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Clock size={12} className="mr-1" />
                Recent
              </div>
              {recentAddresses.slice(0, 3).map((addr, index) => (
                <button
                  key={`${addr.address}_${index}`}
                  onClick={() => handleAddressSelect(addr.address)}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="text-xs text-gray-500 font-mono">{formatAddress(addr.address)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Add to Address Book Option */}
          {value && isValid && !showAddToBook && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAddToBook(true)}
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center text-sm text-blue-600 dark:text-blue-400"
              >
                <Plus size={12} className="mr-1" />
                Add to Address Book
              </button>
            </div>
          )}

          {/* Add to Address Book Form */}
          {showAddToBook && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter nickname"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="text-sm"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleAddToAddressBook}
                    disabled={!newNickname.trim() || isAddingToBook}
                    className="flex-1"
                  >
                    {isAddingToBook ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddToBook(false);
                      setNewNickname('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
