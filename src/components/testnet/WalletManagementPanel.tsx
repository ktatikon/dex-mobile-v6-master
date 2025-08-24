/**
 * Wallet Management Panel
 * Enhanced wallet management with multi-wallet support
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, Plus, Download, Upload, Star, Archive, 
  Copy, ExternalLink, RefreshCw, Shield, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatAddress } from '@/services/ethersService';
import { testnetWalletManager } from '@/services/testnetWalletManager';

interface WalletManagementPanelProps {
  myWallet: any;
  wallets: any[];
  onRefresh: () => void;
  expanded?: boolean;
}

export const WalletManagementPanel: React.FC<WalletManagementPanelProps> = ({
  myWallet,
  wallets,
  onRefresh,
  expanded = false
}) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [importName, setImportName] = useState('');
  const [importKey, setImportKey] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [exportData, setExportData] = useState<any>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a wallet name",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = await testnetWalletManager.createWallet(myWallet?.userId || '', {
        name: newWalletName,
        network: 'Sepolia',
        walletType: 'generated'
      });

      if (wallet) {
        toast({
          title: "Wallet Created",
          description: `"${newWalletName}" has been created successfully`,
        });
        setNewWalletName('');
        setShowCreateDialog(false);
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create wallet",
        variant: "destructive",
      });
    }
  };

  const handleImportWallet = async () => {
    if (!importName.trim() || !importKey.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both wallet name and private key",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = await testnetWalletManager.importWallet(myWallet?.userId || '', {
        name: importName,
        network: 'Sepolia',
        privateKey: importKey
      });

      if (wallet) {
        toast({
          title: "Wallet Imported",
          description: `"${importName}" has been imported successfully`,
        });
        setImportName('');
        setImportKey('');
        setShowImportDialog(false);
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import wallet",
        variant: "destructive",
      });
    }
  };

  const handleExportWallet = async (walletId: string) => {
    try {
      const data = await testnetWalletManager.exportWallet(myWallet?.userId || '', walletId);
      if (data) {
        setExportData(data);
        setShowExportDialog(true);
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export wallet",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      const success = await testnetWalletManager.setPrimaryWallet(myWallet?.userId || '', walletId);
      if (success) {
        toast({
          title: "Primary Wallet Updated",
          description: "Primary wallet has been changed",
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update primary wallet",
        variant: "destructive",
      });
    }
  };

  const handleArchiveWallet = async (walletId: string, archive: boolean) => {
    try {
      const success = await testnetWalletManager.archiveWallet(myWallet?.userId || '', walletId, archive);
      if (success) {
        toast({
          title: archive ? "Wallet Archived" : "Wallet Restored",
          description: `Wallet has been ${archive ? 'archived' : 'restored'}`,
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: `Failed to ${archive ? 'archive' : 'restore'} wallet`,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Wallet Management</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                  <DialogDescription>
                    Create a new testnet wallet with secure key generation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wallet-name">Wallet Name</Label>
                    <Input
                      id="wallet-name"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      placeholder="Enter wallet name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWallet}>
                    Create Wallet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Existing Wallet</DialogTitle>
                  <DialogDescription>
                    Import a wallet using your private key
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="import-name">Wallet Name</Label>
                    <Input
                      id="import-name"
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                      placeholder="Enter wallet name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-key">Private Key</Label>
                    <Input
                      id="import-key"
                      type="password"
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                      placeholder="Enter private key"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImportWallet}>
                    Import Wallet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* My Wallet */}
        {myWallet && (
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">{myWallet.name}</span>
                <Badge variant="default">Primary</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(myWallet.address, 'Address')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleExportWallet(myWallet.id)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatAddress(myWallet.address)}
            </div>
            <div className="text-lg font-semibold mt-2">
              {myWallet.balance} ETH
            </div>
          </div>
        )}

        {/* Other Wallets */}
        {expanded && wallets.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Other Wallets</h4>
            {wallets.filter(w => w.id !== myWallet?.id).map((wallet) => (
              <div key={wallet.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{wallet.name}</span>
                    {wallet.isPrimary && <Badge variant="secondary">Primary</Badge>}
                    {wallet.isArchived && <Badge variant="outline">Archived</Badge>}
                  </div>
                  <div className="flex items-center space-x-1">
                    {!wallet.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(wallet.id)}
                        title="Set as primary"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(wallet.address, 'Address')}
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportWallet(wallet.id)}
                      title="Export wallet"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchiveWallet(wallet.id, !wallet.isArchived)}
                      title={wallet.isArchived ? "Restore wallet" : "Archive wallet"}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatAddress(wallet.address)}
                </div>
                <div className="text-sm font-medium mt-1">
                  {wallet.balance} ETH
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Wallet</DialogTitle>
              <DialogDescription>
                Keep your private key secure and never share it with anyone
              </DialogDescription>
            </DialogHeader>
            {exportData && (
              <div className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={exportData.address} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(exportData.address, 'Address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Private Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showPrivateKey ? "text" : "password"}
                      value={exportData.privateKey}
                      readOnly
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(exportData.privateKey, 'Private Key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => {
                setShowExportDialog(false);
                setExportData(null);
                setShowPrivateKey(false);
              }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
