/**
 * Gas Optimization Panel
 * Real-time gas price monitoring and optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, TrendingUp, TrendingDown, Minus, 
  RefreshCw, Clock, DollarSign, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testnetGasManager } from '@/services/testnetGasManager';

interface GasOptimizationPanelProps {
  gasData: any;
  activeNetwork: string;
  onRefresh: () => void;
}

export const GasOptimizationPanel: React.FC<GasOptimizationPanelProps> = ({
  gasData,
  activeNetwork,
  onRefresh
}) => {
  const { toast } = useToast();
  const [currentGas, setCurrentGas] = useState<any>(null);
  const [gasHistory, setGasHistory] = useState<any[]>([]);
  const [gasStats, setGasStats] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGasData();
    const interval = setInterval(loadGasData, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [activeNetwork]);

  const loadGasData = async () => {
    try {
      setLoading(true);
      
      // Load current gas prices
      const current = await testnetGasManager.getCurrentGasPrices(activeNetwork);
      setCurrentGas(current);

      // Load gas statistics
      const stats = await testnetGasManager.getGasStatistics(activeNetwork, 24);
      setGasStats(stats);

      // Load gas history
      const history = await testnetGasManager.getGasPriceHistory(activeNetwork, 6);
      setGasHistory(history);

      // Get optimization suggestion for standard transaction
      if (current) {
        const opt = await testnetGasManager.getGasOptimization(
          activeNetwork,
          current.standard,
          '21000'
        );
        setOptimization(opt);
      }

    } catch (error) {
      console.error('Failed to load gas data:', error);
      toast({
        title: "Gas Data Error",
        description: "Failed to load gas information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600 border-red-600';
      case 'down':
        return 'text-green-600 border-green-600';
      default:
        return 'text-gray-600 border-gray-600';
    }
  };

  const getGasSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'slow':
        return { label: 'Slow', time: '~5 min', color: 'text-blue-600' };
      case 'standard':
        return { label: 'Standard', time: '~2 min', color: 'text-green-600' };
      case 'fast':
        return { label: 'Fast', time: '~30 sec', color: 'text-orange-600' };
      case 'instant':
        return { label: 'Instant', time: '~15 sec', color: 'text-red-600' };
      default:
        return { label: 'Unknown', time: '', color: 'text-gray-600' };
    }
  };

  const calculateTransactionCost = (gasPrice: string, gasLimit: string = '21000') => {
    const cost = (parseFloat(gasPrice) * parseFloat(gasLimit)) / 1e9; // Convert to ETH
    return cost.toFixed(6);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Gas Optimization</span>
          </CardTitle>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadGasData();
              onRefresh();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Gas Prices */}
        {currentGas && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Current Gas Prices</h4>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Updated {new Date(currentGas.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentGas).filter(([key]) => key !== 'timestamp').map(([speed, price]) => {
                const speedInfo = getGasSpeedLabel(speed);
                const cost = calculateTransactionCost(price as string);
                
                return (
                  <div key={speed} className="p-3 border rounded-lg text-center">
                    <div className={`font-medium ${speedInfo.color}`}>
                      {speedInfo.label}
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {parseFloat(price as string).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">gwei</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {speedInfo.time}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      ~{cost} ETH
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gas Statistics */}
        {gasStats && (
          <div className="space-y-4">
            <h4 className="font-medium">24-Hour Statistics</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {gasStats.average.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Average (gwei)</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {gasStats.min.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Minimum (gwei)</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {gasStats.max.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Maximum (gwei)</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="text-2xl font-bold">
                    {gasStats.median.toFixed(1)}
                  </div>
                  {getTrendIcon(gasStats.trend)}
                </div>
                <div className="text-xs text-muted-foreground">Median (gwei)</div>
                <Badge 
                  variant="outline" 
                  className={`text-xs mt-1 ${getTrendColor(gasStats.trend)}`}
                >
                  {gasStats.trend}
                </Badge>
              </div>
            </div>

            {/* Gas Price Range Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low ({gasStats.min.toFixed(1)} gwei)</span>
                <span>High ({gasStats.max.toFixed(1)} gwei)</span>
              </div>
              <Progress 
                value={((gasStats.average - gasStats.min) / (gasStats.max - gasStats.min)) * 100} 
                className="h-2"
              />
              <div className="text-center text-xs text-muted-foreground">
                Current average: {gasStats.average.toFixed(1)} gwei
              </div>
            </div>
          </div>
        )}

        {/* Optimization Recommendation */}
        {optimization && (
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">Optimization Recommendation</span>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {optimization.recommendation}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Current Gas Price</div>
                  <div className="font-medium">{optimization.currentGas} gwei</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground">Recommended Gas Price</div>
                  <div className="font-medium">{optimization.optimizedGas} gwei</div>
                </div>
                
                {optimization.savings !== '0' && (
                  <>
                    <div>
                      <div className="text-muted-foreground">Potential Savings</div>
                      <div className="font-medium text-green-600">
                        {optimization.savings} ETH ({optimization.savingsPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gas Price History Chart */}
        {gasHistory.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Recent Gas Price History</h4>
            
            <div className="space-y-2">
              {gasHistory.slice(0, 10).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>{entry.gasPriceGwei.toFixed(1)} gwei</span>
                    <span className="text-muted-foreground">
                      Block #{entry.blockNumber.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {entry.transactionCount} txs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gas Estimation Tool */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Transaction Cost Estimator</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Simple Transfer (21,000 gas)</div>
              {currentGas && (
                <div className="space-y-1 mt-1">
                  <div>Slow: ~{calculateTransactionCost(currentGas.slow)} ETH</div>
                  <div>Standard: ~{calculateTransactionCost(currentGas.standard)} ETH</div>
                  <div>Fast: ~{calculateTransactionCost(currentGas.fast)} ETH</div>
                </div>
              )}
            </div>
            
            <div>
              <div className="text-muted-foreground">Token Transfer (65,000 gas)</div>
              {currentGas && (
                <div className="space-y-1 mt-1">
                  <div>Slow: ~{calculateTransactionCost(currentGas.slow, '65000')} ETH</div>
                  <div>Standard: ~{calculateTransactionCost(currentGas.standard, '65000')} ETH</div>
                  <div>Fast: ~{calculateTransactionCost(currentGas.fast, '65000')} ETH</div>
                </div>
              )}
            </div>
            
            <div>
              <div className="text-muted-foreground">Contract Deploy (200,000 gas)</div>
              {currentGas && (
                <div className="space-y-1 mt-1">
                  <div>Slow: ~{calculateTransactionCost(currentGas.slow, '200000')} ETH</div>
                  <div>Standard: ~{calculateTransactionCost(currentGas.standard, '200000')} ETH</div>
                  <div>Fast: ~{calculateTransactionCost(currentGas.fast, '200000')} ETH</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
