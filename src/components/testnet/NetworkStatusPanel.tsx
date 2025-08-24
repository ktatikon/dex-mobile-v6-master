/**
 * Network Status Panel
 * Real-time network health monitoring and switching
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Network, Wifi, WifiOff, Activity, Clock,
  Zap, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testnetNetworkManager } from '@/services/testnetNetworkManager';

interface NetworkStatusPanelProps {
  networkHealth: Record<string, string>;
  activeNetwork: string;
  onNetworkSwitch: (network: string) => void;
  onRefresh: () => void;
}

export const NetworkStatusPanel: React.FC<NetworkStatusPanelProps> = ({
  networkHealth,
  activeNetwork,
  onNetworkSwitch,
  onRefresh
}) => {
  const { toast } = useToast();
  const [networks, setNetworks] = useState<any[]>([]);
  const [healthDetails, setHealthDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      const networkList = await testnetNetworkManager.getNetworks(true);
      setNetworks(networkList);

      // Get detailed health information
      const details: Record<string, any> = {};
      for (const network of networkList) {
        try {
          const health = await testnetNetworkManager.checkNetworkHealth(network.id);
          details[network.name] = health;
        } catch (error) {
          details[network.name] = {
            isConnected: false,
            error: 'Health check failed',
            latency: 0
          };
        }
      }
      setHealthDetails(details);
    } catch (error) {
      console.error('Failed to load network data:', error);
      toast({
        title: "Network Data Error",
        description: "Failed to load network information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkSwitch = async (networkName: string) => {
    if (networkName === activeNetwork) return;

    try {
      setLoading(true);
      await onNetworkSwitch(networkName);
    } catch (error) {
      console.error('Network switch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 border-green-600';
      case 'degraded':
        return 'text-yellow-600 border-yellow-600';
      case 'down':
        return 'text-red-600 border-red-600';
      default:
        return 'text-gray-600 border-gray-600';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Network Status</span>
          </CardTitle>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadNetworkData();
              onRefresh();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Network Status */}
        <div className="p-4 border rounded-lg bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="font-medium">Active Network</span>
            </div>
            <Badge variant="default">{activeNetwork}</Badge>
          </div>

          {healthDetails[activeNetwork] && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="flex items-center space-x-1 mt-1">
                  {getHealthIcon(networkHealth[activeNetwork])}
                  <span className="capitalize">{networkHealth[activeNetwork]}</span>
                </div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Latency</div>
                <div className={`mt-1 font-medium ${getLatencyColor(healthDetails[activeNetwork].latency)}`}>
                  {healthDetails[activeNetwork].latency}ms
                </div>
              </div>
              
              {healthDetails[activeNetwork].blockNumber && (
                <div>
                  <div className="text-muted-foreground">Block</div>
                  <div className="mt-1 font-medium">
                    #{healthDetails[activeNetwork].blockNumber.toLocaleString()}
                  </div>
                </div>
              )}
              
              {healthDetails[activeNetwork].gasPrice && (
                <div>
                  <div className="text-muted-foreground">Gas Price</div>
                  <div className="mt-1 font-medium">
                    {parseFloat(healthDetails[activeNetwork].gasPrice).toFixed(2)} gwei
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Networks */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Available Networks</h4>
          
          {networks.map((network) => {
            const health = healthDetails[network.name];
            const isActive = network.name === activeNetwork;
            
            return (
              <div
                key={network.id}
                className={`p-3 border rounded-lg transition-colors ${
                  isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getHealthIcon(networkHealth[network.name])}
                      <span className="font-medium">{network.name}</span>
                    </div>
                    
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getHealthColor(networkHealth[network.name])}`}
                    >
                      {networkHealth[network.name] || 'Unknown'}
                    </Badge>
                  </div>

                  {!isActive && networkHealth[network.name] === 'healthy' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNetworkSwitch(network.name)}
                      disabled={loading}
                    >
                      Switch
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  <div>
                    <span>Chain ID: {network.chainId}</span>
                  </div>
                  
                  {health && (
                    <>
                      <div>
                        <span className={getLatencyColor(health.latency)}>
                          Latency: {health.latency}ms
                        </span>
                      </div>
                      
                      {health.blockNumber && (
                        <div>
                          <span>Block: #{health.blockNumber.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {health.gasPrice && (
                        <div>
                          <span>Gas: {parseFloat(health.gasPrice).toFixed(1)} gwei</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Connection Quality Indicator */}
                {health && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Connection Quality</span>
                      <span className={getLatencyColor(health.latency)}>
                        {health.latency < 100 ? 'Excellent' : 
                         health.latency < 300 ? 'Good' : 'Poor'}
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (health.latency / 10))} 
                      className="h-1"
                    />
                  </div>
                )}

                {/* Error Display */}
                {health?.error && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    {health.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Network Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(networkHealth).filter(status => status === 'healthy').length}
            </div>
            <div className="text-xs text-muted-foreground">Healthy Networks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(networkHealth).filter(status => status === 'degraded').length}
            </div>
            <div className="text-xs text-muted-foreground">Degraded Networks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(networkHealth).filter(status => status === 'down').length}
            </div>
            <div className="text-xs text-muted-foreground">Down Networks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {healthDetails[activeNetwork]?.latency || 0}ms
            </div>
            <div className="text-xs text-muted-foreground">Current Latency</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
