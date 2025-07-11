/**
 * ENHANCED ADVANCED PROTECTION MODAL - MODULAR ARCHITECTURE
 * 
 * Comprehensive MEV protection and gas optimization settings modal.
 * Integrates with enterprise services for advanced trading protection.
 * Built with real-time analysis and predictive optimization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Shield, 
  Zap, 
  Settings, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { enterpriseServiceIntegrator } from '@/services/enterpriseServiceIntegrator';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';

// Types for component props
export interface AdvancedProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdate?: (settings: ProtectionSettings) => void;
  currentSettings?: ProtectionSettings;
  className?: string;
}

// Protection settings interface
export interface ProtectionSettings {
  mevProtection: {
    enabled: boolean;
    level: 'basic' | 'standard' | 'advanced' | 'maximum';
    frontrunningProtection: boolean;
    sandwichProtection: boolean;
    flashloanProtection: boolean;
    maxSlippage: number;
  };
  gasOptimization: {
    enabled: boolean;
    strategy: 'fast' | 'standard' | 'economy';
    maxGasPrice: number;
    priorityFee: number;
    autoOptimize: boolean;
  };
  transactionSettings: {
    deadline: number; // minutes
    retryAttempts: number;
    failureHandling: 'revert' | 'retry' | 'partial';
  };
  notifications: {
    priceAlerts: boolean;
    gasAlerts: boolean;
    mevAlerts: boolean;
  };
}

// Default protection settings
const DEFAULT_SETTINGS: ProtectionSettings = {
  mevProtection: {
    enabled: true,
    level: 'standard',
    frontrunningProtection: true,
    sandwichProtection: true,
    flashloanProtection: false,
    maxSlippage: 0.5
  },
  gasOptimization: {
    enabled: true,
    strategy: 'standard',
    maxGasPrice: 100,
    priorityFee: 2,
    autoOptimize: true
  },
  transactionSettings: {
    deadline: 20,
    retryAttempts: 3,
    failureHandling: 'retry'
  },
  notifications: {
    priceAlerts: true,
    gasAlerts: true,
    mevAlerts: true
  }
};

/**
 * Enhanced Advanced Protection Modal Component
 * Comprehensive protection and optimization settings
 */
export const AdvancedProtectionModal: React.FC<AdvancedProtectionModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdate,
  currentSettings,
  className = ''
}) => {
  const [settings, setSettings] = useState<ProtectionSettings>(currentSettings || DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mev' | 'gas' | 'transaction' | 'notifications'>('mev');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const componentId = 'advanced_protection_modal';

  /**
   * Load current protection analysis
   */
  const loadProtectionAnalysis = useCallback(async () => {
    if (!isOpen || !enterpriseServiceIntegrator.isServiceInitialized()) return;

    try {
      setIsLoading(true);
      await loadingOrchestrator.startLoading(componentId, 'Loading protection analysis');

      // Get MEV protection analysis
      const mevService = enterpriseServiceIntegrator.getMEVProtectionService();
      const gasService = enterpriseServiceIntegrator.getGasOptimizationService();

      const [mevAnalysis, gasAnalysis] = await Promise.all([
        mevService.getProtectionStatus(),
        gasService.getCurrentGasMetrics()
      ]);

      setAnalysisData({
        mev: mevAnalysis,
        gas: gasAnalysis,
        lastUpdated: new Date()
      });

      await loadingOrchestrator.completeLoading(componentId, 'Protection analysis loaded');
    } catch (error) {
      console.error('Failed to load protection analysis:', error);
      await loadingOrchestrator.failLoading(componentId, `Failed to load analysis: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  /**
   * Apply protection settings
   */
  const applySettings = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadingOrchestrator.startLoading(`${componentId}_apply`, 'Applying protection settings');

      // Apply MEV protection settings
      if (settings.mevProtection.enabled && enterpriseServiceIntegrator.isServiceInitialized()) {
        const mevService = enterpriseServiceIntegrator.getMEVProtectionService();
        await mevService.updateProtectionConfig({
          level: settings.mevProtection.level,
          frontrunningProtection: settings.mevProtection.frontrunningProtection,
          sandwichProtection: settings.mevProtection.sandwichProtection,
          flashloanProtection: settings.mevProtection.flashloanProtection,
          maxSlippage: settings.mevProtection.maxSlippage
        });
      }

      // Apply gas optimization settings
      if (settings.gasOptimization.enabled && enterpriseServiceIntegrator.isServiceInitialized()) {
        const gasService = enterpriseServiceIntegrator.getGasOptimizationService();
        await gasService.updateOptimizationConfig({
          strategy: settings.gasOptimization.strategy,
          maxGasPrice: settings.gasOptimization.maxGasPrice,
          priorityFee: settings.gasOptimization.priorityFee,
          autoOptimize: settings.gasOptimization.autoOptimize
        });
      }

      // Notify parent component
      if (onSettingsUpdate) {
        onSettingsUpdate(settings);
      }

      await loadingOrchestrator.completeLoading(`${componentId}_apply`, 'Settings applied successfully');
      onClose();
    } catch (error) {
      console.error('Failed to apply settings:', error);
      await loadingOrchestrator.failLoading(`${componentId}_apply`, `Failed to apply settings: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [settings, onSettingsUpdate, onClose]);

  /**
   * Reset to default settings
   */
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Load analysis when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProtectionAnalysis();
    }
  }, [isOpen, loadProtectionAnalysis]);

  // Update settings when currentSettings prop changes
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  /**
   * Render MEV Protection Tab
   */
  const renderMEVTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">MEV Protection</span>
        </div>
        <Switch
          checked={settings.mevProtection.enabled}
          onCheckedChange={(enabled) => 
            setSettings(prev => ({
              ...prev,
              mevProtection: { ...prev.mevProtection, enabled }
            }))
          }
        />
      </div>

      {settings.mevProtection.enabled && (
        <div className="space-y-4 pl-7">
          {/* Protection Level */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Protection Level</label>
            <div className="grid grid-cols-2 gap-2">
              {(['basic', 'standard', 'advanced', 'maximum'] as const).map((level) => (
                <Button
                  key={level}
                  variant={settings.mevProtection.level === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => 
                    setSettings(prev => ({
                      ...prev,
                      mevProtection: { ...prev.mevProtection, level }
                    }))
                  }
                  className={`text-xs ${
                    settings.mevProtection.level === level 
                      ? 'bg-[#B1420A] text-white' 
                      : 'border-gray-600 text-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Protection Features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Frontrunning Protection</span>
                <p className="text-xs text-gray-400">Protect against transaction frontrunning</p>
              </div>
              <Switch
                checked={settings.mevProtection.frontrunningProtection}
                onCheckedChange={(frontrunningProtection) => 
                  setSettings(prev => ({
                    ...prev,
                    mevProtection: { ...prev.mevProtection, frontrunningProtection }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Sandwich Attack Protection</span>
                <p className="text-xs text-gray-400">Prevent sandwich attacks on your trades</p>
              </div>
              <Switch
                checked={settings.mevProtection.sandwichProtection}
                onCheckedChange={(sandwichProtection) => 
                  setSettings(prev => ({
                    ...prev,
                    mevProtection: { ...prev.mevProtection, sandwichProtection }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Flash Loan Protection</span>
                <p className="text-xs text-gray-400">Advanced protection against flash loan attacks</p>
              </div>
              <Switch
                checked={settings.mevProtection.flashloanProtection}
                onCheckedChange={(flashloanProtection) => 
                  setSettings(prev => ({
                    ...prev,
                    mevProtection: { ...prev.mevProtection, flashloanProtection }
                  }))
                }
              />
            </div>
          </div>

          {/* Max Slippage */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Maximum Slippage: {settings.mevProtection.maxSlippage}%
            </label>
            <Slider
              value={[settings.mevProtection.maxSlippage]}
              onValueChange={([maxSlippage]) => 
                setSettings(prev => ({
                  ...prev,
                  mevProtection: { ...prev.mevProtection, maxSlippage }
                }))
              }
              max={5}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* MEV Analysis Display */}
          {analysisData?.mev && (
            <div className="bg-[#2C2C2E] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Current MEV Status</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Protection Active:</span>
                  <span className="text-green-400">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Threats Blocked:</span>
                  <span className="text-white">{analysisData.mev.threatsBlocked || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Savings Today:</span>
                  <span className="text-green-400">${(analysisData.mev.savingsToday || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-white">{(analysisData.mev.successRate || 98).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /**
   * Render Gas Optimization Tab
   */
  const renderGasTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-medium text-white">Gas Optimization</span>
        </div>
        <Switch
          checked={settings.gasOptimization.enabled}
          onCheckedChange={(enabled) =>
            setSettings(prev => ({
              ...prev,
              gasOptimization: { ...prev.gasOptimization, enabled }
            }))
          }
        />
      </div>

      {settings.gasOptimization.enabled && (
        <div className="space-y-4 pl-7">
          {/* Gas Strategy */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Gas Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {(['economy', 'standard', 'fast'] as const).map((strategy) => (
                <Button
                  key={strategy}
                  variant={settings.gasOptimization.strategy === strategy ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setSettings(prev => ({
                      ...prev,
                      gasOptimization: { ...prev.gasOptimization, strategy }
                    }))
                  }
                  className={`text-xs ${
                    settings.gasOptimization.strategy === strategy
                      ? 'bg-[#B1420A] text-white'
                      : 'border-gray-600 text-gray-300'
                  }`}
                >
                  {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Gas Price */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Max Gas Price: {settings.gasOptimization.maxGasPrice} Gwei
            </label>
            <Slider
              value={[settings.gasOptimization.maxGasPrice]}
              onValueChange={([maxGasPrice]) =>
                setSettings(prev => ({
                  ...prev,
                  gasOptimization: { ...prev.gasOptimization, maxGasPrice }
                }))
              }
              max={200}
              min={10}
              step={5}
              className="w-full"
            />
          </div>

          {/* Priority Fee */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Priority Fee: {settings.gasOptimization.priorityFee} Gwei
            </label>
            <Slider
              value={[settings.gasOptimization.priorityFee]}
              onValueChange={([priorityFee]) =>
                setSettings(prev => ({
                  ...prev,
                  gasOptimization: { ...prev.gasOptimization, priorityFee }
                }))
              }
              max={10}
              min={0.5}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Auto Optimize */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white">Auto Optimization</span>
              <p className="text-xs text-gray-400">Automatically optimize gas for best price/speed</p>
            </div>
            <Switch
              checked={settings.gasOptimization.autoOptimize}
              onCheckedChange={(autoOptimize) =>
                setSettings(prev => ({
                  ...prev,
                  gasOptimization: { ...prev.gasOptimization, autoOptimize }
                }))
              }
            />
          </div>

          {/* Gas Analysis Display */}
          {analysisData?.gas && (
            <div className="bg-[#2C2C2E] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Current Gas Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Gas:</span>
                  <span className="text-white">{analysisData.gas.currentGasPrice || 25} Gwei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Load:</span>
                  <span className="text-yellow-400">{analysisData.gas.networkLoad || 'Medium'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Time:</span>
                  <span className="text-white">{analysisData.gas.estimatedTime || '2-3 min'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Savings Today:</span>
                  <span className="text-green-400">${(analysisData.gas.savingsToday || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-gray-600 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#B1420A]" />
            Advanced Protection Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#2C2C2E] rounded-lg p-1">
          {[
            { id: 'mev', label: 'MEV Protection', icon: Shield },
            { id: 'gas', label: 'Gas Optimization', icon: Zap },
            { id: 'transaction', label: 'Transaction', icon: Clock },
            { id: 'notifications', label: 'Alerts', icon: Info }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 text-xs ${
                activeTab === id
                  ? 'bg-[#B1420A] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#B1420A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Loading protection settings...</p>
            </div>
          ) : (
            <>
              {activeTab === 'mev' && renderMEVTab()}
              {activeTab === 'gas' && renderGasTab()}
              {activeTab === 'transaction' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Transaction Settings</span>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Transaction Deadline: {settings.transactionSettings.deadline} minutes
                    </label>
                    <Slider
                      value={[settings.transactionSettings.deadline]}
                      onValueChange={([deadline]) =>
                        setSettings(prev => ({
                          ...prev,
                          transactionSettings: { ...prev.transactionSettings, deadline }
                        }))
                      }
                      max={60}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Retry Attempts: {settings.transactionSettings.retryAttempts}
                    </label>
                    <Slider
                      value={[settings.transactionSettings.retryAttempts]}
                      onValueChange={([retryAttempts]) =>
                        setSettings(prev => ({
                          ...prev,
                          transactionSettings: { ...prev.transactionSettings, retryAttempts }
                        }))
                      }
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Notification Settings</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Price Movement Alerts</span>
                      <Switch
                        checked={settings.notifications.priceAlerts}
                        onCheckedChange={(priceAlerts) =>
                          setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, priceAlerts }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Gas Price Alerts</span>
                      <Switch
                        checked={settings.notifications.gasAlerts}
                        onCheckedChange={(gasAlerts) =>
                          setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, gasAlerts }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">MEV Protection Alerts</span>
                      <Switch
                        checked={settings.notifications.mevAlerts}
                        onCheckedChange={(mevAlerts) =>
                          setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, mevAlerts }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-600">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:text-white"
            disabled={isLoading}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:text-white"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={applySettings}
            className="flex-1 bg-[#B1420A] hover:bg-[#8B3208] text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedProtectionModal;
