/**
 * WEB ADVANCED SWAP SETTINGS COMPONENT - ENTERPRISE IMPLEMENTATION
 * Web-compatible version using Shadcn/UI components
 * Comprehensive swap configuration with MEV protection, gas optimization, and expert features
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Shield, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Info,
  Gauge,
  Lock,
  Unlock,
  Route
} from 'lucide-react';

// ==================== TYPES & INTERFACES ====================

export interface SwapSettings {
  slippageTolerance: number; // percentage
  deadline: number; // minutes
  mevProtectionEnabled: boolean;
  gasOptimizationEnabled: boolean;
  priorityFeeStrategy: 'low' | 'moderate' | 'high' | 'custom';
  maxGasPrice: number; // gwei
  infiniteApproval: boolean;
  expertMode: boolean;
  multihopEnabled: boolean;
  autoSlippageEnabled: boolean;
  customPriorityFee?: number; // gwei
}

export interface WebAdvancedSwapSettingsProps {
  visible: boolean;
  settings: SwapSettings;
  onSettingsChange: (settings: SwapSettings) => void;
  onClose: () => void;
  networkId: string;
}

// ==================== COMPONENT ====================

export const WebAdvancedSwapSettings: React.FC<WebAdvancedSwapSettingsProps> = ({
  visible,
  settings,
  onSettingsChange,
  onClose,
  networkId
}) => {
  const [localSettings, setLocalSettings] = useState<SwapSettings>(settings);
  const [activeTab, setActiveTab] = useState('general');

  // ==================== EFFECTS ====================

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // ==================== HANDLERS ====================

  const handleSettingChange = <K extends keyof SwapSettings>(
    key: K,
    value: SwapSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: SwapSettings = {
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
    };
    setLocalSettings(defaultSettings);
  };

  // ==================== RENDER HELPERS ====================

  const getGasStrategyDescription = (strategy: string): string => {
    switch (strategy) {
      case 'low': return 'Slower confirmation, lower fees';
      case 'moderate': return 'Balanced speed and cost';
      case 'high': return 'Faster confirmation, higher fees';
      case 'custom': return 'Set your own priority fee';
      default: return '';
    }
  };

  const getSlippageWarning = (slippage: number): { level: 'none' | 'warning' | 'danger'; message: string } => {
    if (slippage < 0.1) return { level: 'warning', message: 'Very low slippage may cause transaction failures' };
    if (slippage > 5) return { level: 'danger', message: 'High slippage increases MEV risk' };
    if (slippage > 1) return { level: 'warning', message: 'Consider if high slippage is necessary' };
    return { level: 'none', message: '' };
  };

  const slippageWarning = getSlippageWarning(localSettings.slippageTolerance);

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dex-dark border-dex-primary/30">
        <DialogHeader>
          <DialogTitle className="text-dex-text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Swap Settings
          </DialogTitle>
          <DialogDescription className="text-dex-text-secondary">
            Configure advanced parameters for optimal swap execution
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="gas">Gas & MEV</TabsTrigger>
            <TabsTrigger value="expert">Expert</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary">Slippage Tolerance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-dex-text-secondary">Tolerance (%)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={localSettings.autoSlippageEnabled}
                        onCheckedChange={(checked) => handleSettingChange('autoSlippageEnabled', checked)}
                      />
                      <span className="text-xs text-dex-text-secondary">Auto</span>
                    </div>
                  </div>
                  
                  {!localSettings.autoSlippageEnabled && (
                    <div className="space-y-3">
                      <Slider
                        value={[localSettings.slippageTolerance]}
                        onValueChange={([value]) => handleSettingChange('slippageTolerance', value)}
                        max={10}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-dex-text-secondary">
                        <span>0.1%</span>
                        <span className="text-dex-text-primary font-medium">
                          {localSettings.slippageTolerance.toFixed(1)}%
                        </span>
                        <span>10%</span>
                      </div>
                      
                      {/* Quick preset buttons */}
                      <div className="flex space-x-2">
                        {[0.1, 0.5, 1.0, 3.0].map((preset) => (
                          <Button
                            key={preset}
                            variant={localSettings.slippageTolerance === preset ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSettingChange('slippageTolerance', preset)}
                            className="text-xs"
                          >
                            {preset}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {slippageWarning.level !== 'none' && (
                    <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                      slippageWarning.level === 'danger' 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-yellow-500/10 border border-yellow-500/30'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        slippageWarning.level === 'danger' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <div className="text-xs">
                        <div className={`font-medium ${
                          slippageWarning.level === 'danger' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          Slippage Warning
                        </div>
                        <div className="text-dex-text-secondary mt-1">
                          {slippageWarning.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Transaction Deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={localSettings.deadline}
                      onChange={(e) => handleSettingChange('deadline', parseInt(e.target.value) || 20)}
                      className="w-20 bg-dex-secondary/10 border-dex-primary/30"
                      min={1}
                      max={60}
                    />
                    <span className="text-sm text-dex-text-secondary">minutes</span>
                  </div>
                  <p className="text-xs text-dex-text-secondary">
                    Transaction will be cancelled if not confirmed within this time
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Routing Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-dex-text-primary">Enable Multi-hop Routes</Label>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      Allow routing through multiple pools for better prices
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.multihopEnabled}
                    onCheckedChange={(checked) => handleSettingChange('multihopEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gas & MEV Settings Tab */}
          <TabsContent value="gas" className="space-y-6">
            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  MEV Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-dex-text-primary">Enable MEV Protection</Label>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      Protect against front-running and sandwich attacks
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.mevProtectionEnabled}
                    onCheckedChange={(checked) => handleSettingChange('mevProtectionEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Gas Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-dex-text-primary">Enable Gas Optimization</Label>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      Automatically optimize gas usage for better efficiency
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.gasOptimizationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('gasOptimizationEnabled', checked)}
                  />
                </div>

                <Separator className="bg-dex-border/30" />

                <div className="space-y-3">
                  <Label className="text-dex-text-primary">Priority Fee Strategy</Label>
                  <Select
                    value={localSettings.priorityFeeStrategy}
                    onValueChange={(value: any) => handleSettingChange('priorityFeeStrategy', value)}
                  >
                    <SelectTrigger className="bg-dex-secondary/10 border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">Low</Badge>
                          <span>Slower, cheaper</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Moderate</Badge>
                          <span>Balanced</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">High</Badge>
                          <span>Faster, expensive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">Custom</Badge>
                          <span>Set manually</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-dex-text-secondary">
                    {getGasStrategyDescription(localSettings.priorityFeeStrategy)}
                  </p>

                  {localSettings.priorityFeeStrategy === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-dex-text-secondary">Custom Priority Fee (Gwei)</Label>
                      <Input
                        type="number"
                        value={localSettings.customPriorityFee || 2}
                        onChange={(e) => handleSettingChange('customPriorityFee', parseFloat(e.target.value) || 2)}
                        className="bg-dex-secondary/10 border-dex-primary/30"
                        min={0.1}
                        step={0.1}
                      />
                    </div>
                  )}
                </div>

                <Separator className="bg-dex-border/30" />

                <div className="space-y-2">
                  <Label className="text-dex-text-secondary">Max Gas Price (Gwei)</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={localSettings.maxGasPrice}
                      onChange={(e) => handleSettingChange('maxGasPrice', parseInt(e.target.value) || 100)}
                      className="flex-1 bg-dex-secondary/10 border-dex-primary/30"
                      min={1}
                    />
                    <Badge variant="outline" className="text-xs">
                      Current: ~25 Gwei
                    </Badge>
                  </div>
                  <p className="text-xs text-dex-text-secondary">
                    Transaction will fail if gas price exceeds this limit
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expert Settings Tab */}
          <TabsContent value="expert" className="space-y-6">
            <div className="flex items-start space-x-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5" />
              <div className="text-xs">
                <div className="text-orange-400 font-medium">Expert Mode Warning</div>
                <div className="text-dex-text-secondary mt-1">
                  These settings are for advanced users only. Incorrect configuration may result in failed transactions or loss of funds.
                </div>
              </div>
            </div>

            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Expert Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-dex-text-primary">Enable Expert Mode</Label>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      Disable transaction confirmations and enable advanced features
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.expertMode}
                    onCheckedChange={(checked) => handleSettingChange('expertMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dex-secondary/10 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-dex-text-primary flex items-center gap-2">
                  {localSettings.infiniteApproval ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  Token Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-dex-text-primary">Infinite Approvals</Label>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      Approve unlimited token spending to save gas on future transactions
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.infiniteApproval}
                    onCheckedChange={(checked) => handleSettingChange('infiniteApproval', checked)}
                  />
                </div>
                {localSettings.infiniteApproval && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <div className="flex items-start space-x-2">
                      <Info className="h-3 w-3 text-yellow-400 mt-0.5" />
                      <p className="text-xs text-yellow-400">
                        This allows the contract to spend unlimited tokens from your wallet
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-dex-border/30">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-dex-primary/30 text-dex-text-secondary"
          >
            Reset to Defaults
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-dex-primary/30 text-dex-text-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-dex-primary hover:bg-dex-primary/90 text-white"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebAdvancedSwapSettings;
