/**
 * PHASE 4: ADVANCED TRADING PANEL COMPONENT
 *
 * Provides advanced trading interface including limit orders, stop-loss, take-profit,
 * and DCA automation with comprehensive error handling and fallback mechanisms.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Token } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

import {
  safeAdvancedTradingService,
  AdvancedOrder,
  DCAStrategy,
  AdvancedOrderType,
  OrderStatus
} from '@/services/phase4/advancedTradingService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';
import EnhancedTokenSelector from '@/components/TokenSelector';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { ProgressiveLoading } from '@/components/enterprise/EnterpriseLoadingComponents';

// Import our new web-compatible trading components
import { WebAdvancedSwapSettings, SwapSettings } from '@/components/trading/WebAdvancedSwapSettings';
import { WebTransactionProgressTracker, TransactionProgressData } from '@/components/trading/WebTransactionProgressTracker';

// Import service initializer for proper service management
import { serviceInitializer } from '@/services/serviceInitializer';
import { validateTokenForDEX } from '@/services/fallbackDataService';

interface AdvancedTradingPanelProps {
  tokens: Token[];
  selectedFromToken?: Token;
  selectedToToken?: Token;
  onTokenSelect?: (fromToken: Token, toToken: Token) => void;
}

const AdvancedTradingPanel: React.FC<AdvancedTradingPanelProps> = ({
  tokens,
  selectedFromToken,
  selectedToToken,
  onTokenSelect
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State management
  const [fromToken, setFromToken] = useState<Token | null>(selectedFromToken || null);
  const [toToken, setToToken] = useState<Token | null>(selectedToToken || null);
  const [fromAmount, setFromAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [expirationHours, setExpirationHours] = useState('24');

  // DCA specific state
  const [dcaTotalAmount, setDcaTotalAmount] = useState('');
  const [dcaIntervalHours, setDcaIntervalHours] = useState('24');
  const [dcaTotalIntervals, setDcaTotalIntervals] = useState('10');



  // UI state
  const [activeTab, setActiveTab] = useState('limit'); // Default to Limit Orders tab
  const [isLoading, setIsLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<AdvancedOrder[]>([]);
  const [userDCAStrategies, setUserDCAStrategies] = useState<DCAStrategy[]>([]);
  const [phase4Enabled, setPhase4Enabled] = useState(false);

  // New component states
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [swapSettings, setSwapSettings] = useState<SwapSettings>({
    slippageTolerance: 0.5,
    deadline: 20,
    mevProtectionEnabled: true,
    gasOptimizationEnabled: true,
    priorityFeeStrategy: 'moderate',
    maxGasPrice: 100,
    infiniteApproval: false,
    expertMode: false,
    multihopEnabled: true,
    autoSlippageEnabled: true
  });
  const [transactionProgress, setTransactionProgress] = useState<TransactionProgressData | null>(null);
  const [showTransactionProgress, setShowTransactionProgress] = useState(false);

  // Service initialization state
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [serviceInitializationError, setServiceInitializationError] = useState<string | null>(null);
  const [isInitializingServices, setIsInitializingServices] = useState(true);

  // Initialize services on component mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsInitializingServices(true);
        setServiceInitializationError(null);

        console.log('🚀 [AdvancedTradingPanel] Initializing services...');

        const result = await serviceInitializer.initialize();

        if (result.success) {
          setServicesInitialized(true);
          setServiceInitializationError(null);
          console.log('✅ [AdvancedTradingPanel] Services initialized successfully');
        } else {
          setServicesInitialized(false);
          setServiceInitializationError(result.errors.join(', '));
          console.error('❌ [AdvancedTradingPanel] Service initialization failed:', result.errors);
        }
      } catch (error) {
        setServicesInitialized(false);
        setServiceInitializationError(error instanceof Error ? error.message : 'Unknown initialization error');
        console.error('❌ [AdvancedTradingPanel] Service initialization error:', error);
      } finally {
        setIsInitializingServices(false);
      }
    };

    initializeServices();
  }, []);

  // Check Phase 4 availability
  useEffect(() => {
    const config = phase4ConfigManager.getConfig();
    setPhase4Enabled(config.enableAdvancedTrading);

    // Subscribe to config changes
    const unsubscribe = phase4ConfigManager.subscribe((newConfig) => {
      setPhase4Enabled(newConfig.enableAdvancedTrading);
    });

    return unsubscribe;
  }, []);





  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      // This would be implemented to load user's orders and strategies
      // For now, we'll use empty arrays as fallback
      setUserOrders([]);
      setUserDCAStrategies([]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [user]);

  // Load user orders and strategies
  useEffect(() => {
    if (user && phase4Enabled) {
      loadUserData();
    }
  }, [user, phase4Enabled, loadUserData]);



  const handleCreateLimitOrder = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || !targetPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await safeAdvancedTradingService.createLimitOrder({
        userId: user.id,
        fromToken,
        toToken,
        fromAmount,
        targetPrice: parseFloat(targetPrice),
        slippage: swapSettings.slippageTolerance,
        expirationHours: parseFloat(expirationHours)
      });

      if (order) {
        toast({
          title: "Success",
          description: `Limit order created successfully`,
          variant: "default",
        });

        // Reset form
        setFromAmount('');
        setTargetPrice('');

        // Reload user data
        await loadUserData();
      } else {
        throw new Error('Failed to create limit order');
      }

    } catch (error) {
      console.error('Error creating limit order:', error);
      toast({
        title: "Error",
        description: "Failed to create limit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStopLoss = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || !stopPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await safeAdvancedTradingService.createStopLossOrder({
        userId: user.id,
        fromToken,
        toToken,
        fromAmount,
        stopPrice: parseFloat(stopPrice),
        slippage: swapSettings.slippageTolerance
      });

      if (order) {
        toast({
          title: "Success",
          description: `Stop-loss order created successfully`,
          variant: "default",
        });

        setFromAmount('');
        setStopPrice('');
        await loadUserData();
      } else {
        throw new Error('Failed to create stop-loss order');
      }

    } catch (error) {
      console.error('Error creating stop-loss order:', error);
      toast({
        title: "Error",
        description: "Failed to create stop-loss order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDCAStrategy = async () => {
    if (!user || !fromToken || !toToken || !dcaTotalAmount || !dcaIntervalHours || !dcaTotalIntervals) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const strategy = await safeAdvancedTradingService.createDCAStrategy({
        userId: user.id,
        fromToken,
        toToken,
        totalAmount: dcaTotalAmount,
        intervalHours: parseFloat(dcaIntervalHours),
        totalIntervals: parseInt(dcaTotalIntervals)
      });

      if (strategy) {
        toast({
          title: "Success",
          description: `DCA strategy created successfully`,
          variant: "default",
        });

        setDcaTotalAmount('');
        setDcaIntervalHours('24');
        setDcaTotalIntervals('10');
        await loadUserData();
      } else {
        throw new Error('Failed to create DCA strategy');
      }

    } catch (error) {
      console.error('Error creating DCA strategy:', error);
      toast({
        title: "Error",
        description: "Failed to create DCA strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== NEW COMPONENT HANDLERS ====================

  const handleSwapSettingsChange = (newSettings: SwapSettings) => {
    setSwapSettings(newSettings);
  };

  const handleQuoteUpdate = (quote: unknown) => {
    setCurrentQuote(quote);
  };

  const handleTransactionRetry = (stepId: string) => {
    // Implement retry logic for specific transaction steps
    console.log('Retrying step:', stepId);
  };

  const handleTransactionCancel = () => {
    setShowTransactionProgress(false);
    setTransactionProgress(null);
  };

  const handleCloseTransactionProgress = () => {
    setShowTransactionProgress(false);
    setTransactionProgress(null);
  };



  const getOrderStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ACTIVE:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case OrderStatus.FILLED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case OrderStatus.EXPIRED:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ACTIVE:
        return 'bg-blue-500';
      case OrderStatus.FILLED:
        return 'bg-green-500';
      case OrderStatus.CANCELLED:
        return 'bg-red-500';
      case OrderStatus.EXPIRED:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Service initialization loading state
  if (isInitializingServices) {
    return (
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-dex-primary/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-dex-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dex-text-primary mb-2">
                Initializing Trading Services
              </h3>
              <p className="text-dex-text-secondary">
                Setting up Uniswap V3 integration and blockchain connections...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Service initialization error state
  if (!servicesInitialized && serviceInitializationError) {
    return (
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dex-text-primary mb-2">
                Service Initialization Failed
              </h3>
              <p className="text-dex-text-secondary mb-4">
                {serviceInitializationError}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-dex-primary hover:bg-dex-primary/90 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase 4 disabled fallback UI
  if (!phase4Enabled) {
    return (
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-dex-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dex-text-primary mb-2">
              Advanced Trading Features
            </h3>
            <p className="text-dex-text-secondary mb-4">
              Advanced trading features including limit orders, stop-loss, and DCA automation are currently disabled.
            </p>
            <Badge variant="outline" className="text-dex-text-secondary">
              Phase 4 Features Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Trading Interface */}
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-dex-text-primary flex items-center gap-2 font-poppins">
                <div className="w-8 h-8 bg-gradient-to-br from-[#B1420A] to-[#D2691E] rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Advanced Order Types
              </CardTitle>
              <p className="text-dex-text-secondary text-sm mt-2 font-poppins">
                Create sophisticated trading strategies with limit orders, stop-loss protection, and DCA automation
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(true)}
              className="border-dex-primary/30 text-dex-text-primary hover:bg-dex-primary/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-[#B1420A]/10 border border-[#B1420A]/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-[#B1420A] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-medium font-poppins text-sm">Advanced Trading Features</h4>
                <p className="text-gray-400 text-xs font-poppins mt-1">
                  For instant swaps, use the main Swap interface on the home page. These tools are for advanced order types and automated strategies.
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-[#2C2C2E] p-1 rounded-lg">
              <TabsTrigger
                value="limit"
                className="data-[state=active]:bg-[#B1420A] data-[state=active]:text-white font-poppins"
              >
                Limit Orders
              </TabsTrigger>
              <TabsTrigger
                value="stop"
                className="data-[state=active]:bg-[#B1420A] data-[state=active]:text-white font-poppins"
              >
                Stop-Loss
              </TabsTrigger>
              <TabsTrigger
                value="dca"
                className="data-[state=active]:bg-[#B1420A] data-[state=active]:text-white font-poppins"
              >
                DCA Strategy
              </TabsTrigger>
            </TabsList>







            {/* Limit Orders Tab */}
            <TabsContent value="limit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="limit-amount">Amount</Label>
                  <Input
                    id="limit-amount"
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="target-price">Target Price</Label>
                  <Input
                    id="target-price"
                    type="number"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slippage">Slippage (%)</Label>
                  <div className="flex items-center justify-between p-3 bg-dex-secondary/10 border border-dex-primary/30 rounded-lg">
                    <span className="text-dex-text-primary">{swapSettings.slippageTolerance}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(true)}
                      className="text-xs text-dex-text-secondary hover:text-dex-text-primary"
                    >
                      Change
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="expiration">Expiration (Hours)</Label>
                  <Select value={expirationHours} onValueChange={setExpirationHours}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="6">6 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="168">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateLimitOrder}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-primary hover:bg-dex-primary/90"
              >
                {isLoading ? 'Creating...' : 'Create Limit Order'}
              </Button>
            </TabsContent>

            {/* Stop-Loss Tab */}
            <TabsContent value="stop" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stop-amount">Amount</Label>
                  <Input
                    id="stop-amount"
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="stop-price">Stop Price</Label>
                  <Input
                    id="stop-price"
                    type="number"
                    placeholder="0.00"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="bg-dex-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-dex-primary" />
                  <span className="text-sm font-medium text-dex-text-primary">Risk Protection</span>
                </div>
                <p className="text-xs text-dex-text-secondary">
                  Stop-loss orders help protect your investment by automatically selling when the price drops below your specified level.
                </p>
              </div>

              <Button
                onClick={handleCreateStopLoss}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-negative hover:bg-dex-negative/90"
              >
                {isLoading ? 'Creating...' : 'Create Stop-Loss Order'}
              </Button>
            </TabsContent>

            {/* DCA Strategy Tab */}
            <TabsContent value="dca" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dca-total">Total Amount</Label>
                  <Input
                    id="dca-total"
                    type="number"
                    placeholder="0.00"
                    value={dcaTotalAmount}
                    onChange={(e) => setDcaTotalAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="dca-intervals">Total Intervals</Label>
                  <Input
                    id="dca-intervals"
                    type="number"
                    placeholder="10"
                    value={dcaTotalIntervals}
                    onChange={(e) => setDcaTotalIntervals(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dca-interval">Interval (Hours)</Label>
                <Select value={dcaIntervalHours} onValueChange={setDcaIntervalHours}>
                  <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every Hour</SelectItem>
                    <SelectItem value="6">Every 6 Hours</SelectItem>
                    <SelectItem value="24">Daily</SelectItem>
                    <SelectItem value="168">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dcaTotalAmount && dcaTotalIntervals && (
                <div className="bg-dex-secondary/50 p-4 rounded-lg">
                  <div className="text-sm text-dex-text-secondary">
                    <div>Amount per interval: {(parseFloat(dcaTotalAmount) / parseInt(dcaTotalIntervals)).toFixed(4)} {fromToken?.symbol}</div>
                    <div>Duration: {(parseInt(dcaTotalIntervals) * parseFloat(dcaIntervalHours) / 24).toFixed(1)} days</div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateDCAStrategy}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-positive hover:bg-dex-positive/90"
              >
                {isLoading ? 'Creating...' : 'Create DCA Strategy'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Orders Display */}
      {userOrders.length > 0 && (
        <Card className="bg-dex-dark/80 border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-text-primary">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-dex-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getOrderStatusIcon(order.status)}
                    <div>
                      <div className="text-sm font-medium text-dex-text-primary">
                        {order.orderType.toUpperCase()} - {order.fromToken.symbol} → {order.toToken.symbol}
                      </div>
                      <div className="text-xs text-dex-text-secondary">
                        {order.fromAmount} {order.fromToken.symbol} @ ${order.targetPrice}
                      </div>
                    </div>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Swap Settings Modal */}
      <WebAdvancedSwapSettings
        visible={showAdvancedSettings}
        settings={swapSettings}
        onSettingsChange={handleSwapSettingsChange}
        onClose={() => setShowAdvancedSettings(false)}
        networkId="ethereum"
      />

      {/* Transaction Progress Tracker Modal */}
      <WebTransactionProgressTracker
        visible={showTransactionProgress}
        progressData={transactionProgress}
        onClose={handleCloseTransactionProgress}
        onRetry={handleTransactionRetry}
        onCancel={handleTransactionCancel}
        networkId="ethereum"
      />

      {/* Service Status Indicator */}
      {!servicesInitialized && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400">
                  UniswapV3Service not initialized
                </p>
                <p className="text-xs text-yellow-400/80">
                  Some features may not work correctly. Please refresh the page.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedTradingPanel;
