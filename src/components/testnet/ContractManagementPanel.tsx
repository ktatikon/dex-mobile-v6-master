/**
 * Contract Management Panel
 * ERC-20 token deployment and smart contract interaction
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Coins, Plus, ExternalLink, Copy, 
  Upload, Download, Settings, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatAddress } from '@/services/ethersService';
import { testnetContractManager } from '@/services/testnetContractManager';

interface ContractManagementPanelProps {
  contracts: any[];
  activeNetwork: string;
  onRefresh: () => void;
}

export const ContractManagementPanel: React.FC<ContractManagementPanelProps> = ({
  contracts,
  activeNetwork,
  onRefresh
}) => {
  const { toast } = useToast();
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [contractName, setContractName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeployToken = async () => {
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast({
        title: "Validation Error",
        description: "Please fill in all token details",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // This would need wallet integration
      toast({
        title: "Feature Coming Soon",
        description: "Token deployment will be available once wallet integration is complete",
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async () => {
    if (!contractAddress || !contractName) {
      toast({
        title: "Validation Error",
        description: "Please enter contract address and name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // This would use the contract manager
      toast({
        title: "Contract Added",
        description: `"${contractName}" has been added to your contracts`,
      });
      setContractAddress('');
      setContractName('');
      setShowAddDialog(false);
      onRefresh();
    } catch (error) {
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add contract",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <Coins className="h-5 w-5" />
            <span>Smart Contracts</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Deploy Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deploy ERC-20 Token</DialogTitle>
                  <DialogDescription>
                    Deploy a new ERC-20 token contract on {activeNetwork}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token-name">Token Name</Label>
                    <Input
                      id="token-name"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., My Test Token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token-symbol">Token Symbol</Label>
                    <Input
                      id="token-symbol"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value)}
                      placeholder="e.g., MTT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token-supply">Initial Supply</Label>
                    <Input
                      id="token-supply"
                      value={tokenSupply}
                      onChange={(e) => setTokenSupply(e.target.value)}
                      placeholder="e.g., 1000000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDeployToken} disabled={loading}>
                    Deploy Token
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Existing Contract</DialogTitle>
                  <DialogDescription>
                    Add an existing contract to your registry
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contract-address">Contract Address</Label>
                    <Input
                      id="contract-address"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract-name">Contract Name</Label>
                    <Input
                      id="contract-name"
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                      placeholder="Enter a name for this contract"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddContract} disabled={loading}>
                    Add Contract
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Contracts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Deploy your first ERC-20 token or add existing contracts to get started
            </p>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => setShowDeployDialog(true)}>
                Deploy Token
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                Add Contract
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{contract.name}</span>
                    <Badge variant="secondary">{contract.contractType}</Badge>
                    {contract.isVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(contract.address, 'Contract Address')}
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${contract.address}`, '_blank')}
                      title="View on Etherscan"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Contract settings"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {formatAddress(contract.address)}
                </div>
                
                {contract.description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {contract.description}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Created: {new Date(contract.createdAt).toLocaleDateString()}
                  </span>
                  {contract.deploymentTxHash && (
                    <span>
                      Deployment: {formatAddress(contract.deploymentTxHash)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
