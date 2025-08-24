/**
 * Enhanced Testnet Wallet Page
 * Integrates all enhanced testnet services with comprehensive UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, RefreshCw, Plus, Send, Download, AlertCircle,
  Info, ExternalLink, Settings, BookOpen, Zap, Network,
  Coins, Fuel, Users, Shield
} from 'lucide-react';
import { useTestnet } from '@/contexts/TestnetContext';
import { useToast } from '@/hooks/use-toast';
import { formatAddress } from '@/services/ethersService';

// Enhanced service imports
import { testnetWalletManager } from '@/services/testnetWalletManager';
import { testnetNetworkManager } from '@/services/testnetNetworkManager';
import { testnetContractManager } from '@/services/testnetContractManager';
import { testnetGasManager } from '@/services/testnetGasManager';
import { testnetAddressManager } from '@/services/testnetAddressManager';

// Component imports
import { WalletManagementPanel } from './WalletManagementPanel';
import { NetworkStatusPanel } from './NetworkStatusPanel';
import { ContractManagementPanel } from './ContractManagementPanel';
import { GasOptimizationPanel } from './GasOptimizationPanel';
import { AddressBookPanel } from './AddressBookPanel';
import { TransactionHistoryPanel } from './TransactionHistoryPanel';

interface EnhancedTestnetWalletPageProps {
  className?: string;
}

const EnhancedTestnetWalletPage: React.FC<EnhancedTestnetWalletPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    activeNetwork,
    setActiveNetwork,
    wallets,
    transactions,
    loading,
    error,
    myWallet,
    createMyWallet,
    refreshWalletData,
  } = useTestnet();

  // Enhanced state management
  const [activeTab, setActiveTab] = useState('overview');
  const [networkHealth, setNetworkHealth] = useState<Record<string, string>>({});
  const [gasData, setGasData] = useState<any>(null);
  const [userContracts, setUserContracts] = useState<any[]>([]);
  const [addressBook, setAddressBook] = useState<any[]>([]);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);

  // Initialize enhanced services
  useEffect(() => {
    initializeEnhancedServices();
    return () => {
      // Cleanup monitoring services
      testnetNetworkManager.stopHealthMonitoring();
      testnetGasManager.stopGasTracking();
    };
  }, []);

  const initializeEnhancedServices = useCallback(async () => {
    try {
      // Start network health monitoring
      testnetNetworkManager.startHealthMonitoring();
      
      // Start gas price tracking
      testnetGasManager.startGasTracking(['Sepolia']);
      
      // Load initial data
      await loadEnhancedData();
      
      setRealTimeMonitoring(true);
      
      toast({
        title: "Enhanced Services Activated",
        description: "Real-time monitoring and advanced features are now active",
      });
    } catch (error) {
      console.error('Failed to initialize enhanced services:', error);
      toast({
        title: "Service Initialization Warning",
        description: "Some enhanced features may not be available",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadEnhancedData = useCallback(async () => {
    if (!myWallet) return;

    try {
      // Load network health
      const networks = await testnetNetworkManager.getNetworks(true);
      const healthStatus: Record<string, string> = {};
      
      for (const network of networks) {
        const health = await testnetNetworkManager.checkNetworkHealth(network.id);
        healthStatus[network.name] = health.isConnected ? 'healthy' : 'down';
      }
      setNetworkHealth(healthStatus);

      // Load gas data
      const currentGas = await testnetGasManager.getCurrentGasPrices(activeNetwork);
      const gasStats = await testnetGasManager.getGasStatistics(activeNetwork);
      setGasData({ current: currentGas, stats: gasStats });

      // Load user contracts
      const contracts = await testnetContractManager.getUserContracts(myWallet.userId);
      setUserContracts(contracts);

      // Load address book
      const addresses = await testnetAddressManager.getAddressBook(myWallet.userId, activeNetwork);
      setAddressBook(addresses);

    } catch (error) {
      console.error('Failed to load enhanced data:', error);
    }
  }, [myWallet, activeNetwork]);

  // Auto-refresh enhanced data
  useEffect(() => {
    if (realTimeMonitoring) {
      const interval = setInterval(loadEnhancedData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeMonitoring, loadEnhancedData]);

  // Create "My Wallet" if it doesn't exist
  useEffect(() => {
    if (!myWallet && !loading) {
      createMyWallet(activeNetwork);
    }
  }, [myWallet, loading, createMyWallet, activeNetwork]);

  const handleNetworkSwitch = async (network: string) => {
    try {
      const result = await testnetNetworkManager.switchNetwork(myWallet?.userId || '', network);
      if (result.success) {
        setActiveNetwork(network as any);
        await loadEnhancedData();
        toast({
          title: "Network Switched",
          description: `Successfully switched to ${network}`,
        });
      } else {
        toast({
          title: "Network Switch Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network switch error:', error);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refreshWalletData(),
        loadEnhancedData()
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "All wallet and network data has been updated",
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh some data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading enhanced testnet services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Network Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Beaker className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Enhanced Testnet Wallet</h1>
          </div>
          
          {realTimeMonitoring && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
              Live Monitoring
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/testnet-settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Network Status Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span className="font-medium">Active Network:</span>
                <Badge variant="secondary">{activeNetwork}</Badge>
                <div className={`w-2 h-2 rounded-full ${
                  networkHealth[activeNetwork] === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              
              {gasData?.current && (
                <div className="flex items-center space-x-2">
                  <Fuel className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Gas: {gasData.current.standard} gwei
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Contracts: {userContracts.length}
              </span>
              <span className="text-sm text-muted-foreground">
                Addresses: {addressBook.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Wallets</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Contracts</span>
          </TabsTrigger>
          <TabsTrigger value="gas" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Gas</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Network</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WalletManagementPanel 
              myWallet={myWallet}
              wallets={wallets}
              onRefresh={refreshWalletData}
            />
            <TransactionHistoryPanel 
              transactions={transactions}
              activeNetwork={activeNetwork}
            />
          </div>
        </TabsContent>

        <TabsContent value="wallets">
          <WalletManagementPanel 
            myWallet={myWallet}
            wallets={wallets}
            onRefresh={refreshWalletData}
            expanded={true}
          />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractManagementPanel 
            contracts={userContracts}
            activeNetwork={activeNetwork}
            onRefresh={loadEnhancedData}
          />
        </TabsContent>

        <TabsContent value="gas">
          <GasOptimizationPanel 
            gasData={gasData}
            activeNetwork={activeNetwork}
            onRefresh={loadEnhancedData}
          />
        </TabsContent>

        <TabsContent value="addresses">
          <AddressBookPanel 
            addressBook={addressBook}
            activeNetwork={activeNetwork}
            onRefresh={loadEnhancedData}
          />
        </TabsContent>

        <TabsContent value="network">
          <NetworkStatusPanel 
            networkHealth={networkHealth}
            activeNetwork={activeNetwork}
            onNetworkSwitch={handleNetworkSwitch}
            onRefresh={loadEnhancedData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTestnetWalletPage;
