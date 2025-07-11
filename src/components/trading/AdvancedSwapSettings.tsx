/**
 * ADVANCED SWAP SETTINGS COMPONENT - ENTERPRISE IMPLEMENTATION
 * Comprehensive swap settings with slippage tolerance, deadline management, MEV protection, and gas optimization
 * Integrates with existing design system and enterprise loading patterns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadingOrchestrator } from '../../services/enterprise/loadingOrchestrator';
import { mevProtectionService } from '../../services/mevProtectionService';

// ==================== TYPES & INTERFACES ====================

export interface SwapSettings {
  slippageTolerance: number; // percentage
  deadline: number; // minutes
  mevProtectionEnabled: boolean;
  gasOptimizationEnabled: boolean;
  priorityFeeStrategy: 'conservative' | 'moderate' | 'aggressive';
  maxGasPrice: number; // gwei
  infiniteApproval: boolean;
  expertMode: boolean;
  multihopEnabled: boolean;
  autoSlippageEnabled: boolean;
}

export interface AdvancedSwapSettingsProps {
  settings: SwapSettings;
  onSettingsChange: (settings: SwapSettings) => void;
  onClose: () => void;
  visible: boolean;
  networkId: string;
}

// ==================== DEFAULT SETTINGS ====================

const DEFAULT_SETTINGS: SwapSettings = {
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

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 3.0];
const DEADLINE_PRESETS = [10, 20, 30, 60];

// ==================== COMPONENT ====================

export const AdvancedSwapSettings: React.FC<AdvancedSwapSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose,
  visible,
  networkId
}) => {
  const [localSettings, setLocalSettings] = useState<SwapSettings>(settings);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [customDeadline, setCustomDeadline] = useState<string>('');
  const [mevProtectionStats, setMevProtectionStats] = useState<any>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (visible && localSettings.mevProtectionEnabled) {
      loadMevProtectionStats();
    }
  }, [visible, localSettings.mevProtectionEnabled]);

  // ==================== HANDLERS ====================

  const loadMevProtectionStats = useCallback(async () => {
    try {
      const stats = mevProtectionService.getProtectionStats();
      setMevProtectionStats(stats);
    } catch (error) {
      console.error('Failed to load MEV protection stats:', error);
    }
  }, []);

  const handleSettingChange = useCallback((key: keyof SwapSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  }, [localSettings]);

  const handleSlippagePreset = useCallback((value: number) => {
    handleSettingChange('slippageTolerance', value);
    setCustomSlippage('');
  }, [handleSettingChange]);

  const handleCustomSlippage = useCallback((value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      handleSettingChange('slippageTolerance', numValue);
    }
  }, [handleSettingChange]);

  const handleDeadlinePreset = useCallback((value: number) => {
    handleSettingChange('deadline', value);
    setCustomDeadline('');
  }, [handleSettingChange]);

  const handleCustomDeadline = useCallback((value: string) => {
    setCustomDeadline(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 4320) { // Max 3 days
      handleSettingChange('deadline', numValue);
    }
  }, [handleSettingChange]);

  const handleSave = useCallback(() => {
    // Validate settings
    if (localSettings.slippageTolerance < 0.01 || localSettings.slippageTolerance > 50) {
      Alert.alert('Invalid Slippage', 'Slippage tolerance must be between 0.01% and 50%');
      return;
    }

    if (localSettings.deadline < 1 || localSettings.deadline > 4320) {
      Alert.alert('Invalid Deadline', 'Deadline must be between 1 minute and 3 days');
      return;
    }

    if (localSettings.maxGasPrice < 1 || localSettings.maxGasPrice > 1000) {
      Alert.alert('Invalid Gas Price', 'Max gas price must be between 1 and 1000 gwei');
      return;
    }

    onSettingsChange(localSettings);
    onClose();
  }, [localSettings, onSettingsChange, onClose]);

  const handleReset = useCallback(() => {
    setLocalSettings(DEFAULT_SETTINGS);
    setCustomSlippage('');
    setCustomDeadline('');
  }, []);

  const handleExpertModeToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        'Expert Mode',
        'Expert Mode allows high slippage trades that often result in bad rates and lost funds. Only use if you know what you\'re doing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => handleSettingChange('expertMode', true) }
        ]
      );
    } else {
      handleSettingChange('expertMode', false);
    }
  }, [handleSettingChange]);

  // ==================== RENDER HELPERS ====================

  const renderSlippageSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Slippage Tolerance</Text>
      <Text style={styles.sectionDescription}>
        Your transaction will revert if the price changes unfavorably by more than this percentage.
      </Text>
      
      <View style={styles.presetContainer}>
        {SLIPPAGE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              localSettings.slippageTolerance === preset && styles.presetButtonActive
            ]}
            onPress={() => handleSlippagePreset(preset)}
          >
            <Text style={[
              styles.presetButtonText,
              localSettings.slippageTolerance === preset && styles.presetButtonTextActive
            ]}>
              {preset}%
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="Custom"
            placeholderTextColor="#8E8E93"
            value={customSlippage}
            onChangeText={handleCustomSlippage}
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <Text style={styles.customInputSuffix}>%</Text>
        </View>
      </View>

      {localSettings.slippageTolerance > 5 && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.warningText}>High slippage tolerance may result in poor trade execution</Text>
        </View>
      )}
    </View>
  );

  const renderDeadlineSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transaction Deadline</Text>
      <Text style={styles.sectionDescription}>
        Your transaction will revert if it is pending for more than this long.
      </Text>
      
      <View style={styles.presetContainer}>
        {DEADLINE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              localSettings.deadline === preset && styles.presetButtonActive
            ]}
            onPress={() => handleDeadlinePreset(preset)}
          >
            <Text style={[
              styles.presetButtonText,
              localSettings.deadline === preset && styles.presetButtonTextActive
            ]}>
              {preset}m
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="Custom"
            placeholderTextColor="#8E8E93"
            value={customDeadline}
            onChangeText={handleCustomDeadline}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.customInputSuffix}>m</Text>
        </View>
      </View>
    </View>
  );

  const renderMevProtectionSettings = () => (
    <View style={styles.section}>
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>MEV Protection</Text>
          <Text style={styles.settingDescription}>
            Protect against sandwich attacks and frontrunning
          </Text>
          {mevProtectionStats && (
            <Text style={styles.statsText}>
              Protected: {mevProtectionStats.totalProtected} | Saved: ${mevProtectionStats.totalSavings.toFixed(2)}
            </Text>
          )}
        </View>
        <Switch
          value={localSettings.mevProtectionEnabled}
          onValueChange={(value) => handleSettingChange('mevProtectionEnabled', value)}
          trackColor={{ false: '#2C2C2E', true: '#B1420A' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderGasSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gas Optimization</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Gas Optimization</Text>
          <Text style={styles.settingDescription}>Automatically optimize gas prices</Text>
        </View>
        <Switch
          value={localSettings.gasOptimizationEnabled}
          onValueChange={(value) => handleSettingChange('gasOptimizationEnabled', value)}
          trackColor={{ false: '#2C2C2E', true: '#B1420A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingTitle}>Priority Fee Strategy</Text>
        <View style={styles.strategyContainer}>
          {(['conservative', 'moderate', 'aggressive'] as const).map((strategy) => (
            <TouchableOpacity
              key={strategy}
              style={[
                styles.strategyButton,
                localSettings.priorityFeeStrategy === strategy && styles.strategyButtonActive
              ]}
              onPress={() => handleSettingChange('priorityFeeStrategy', strategy)}
            >
              <Text style={[
                styles.strategyButtonText,
                localSettings.priorityFeeStrategy === strategy && styles.strategyButtonTextActive
              ]}>
                {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAdvancedSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Advanced Settings</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Expert Mode</Text>
          <Text style={styles.settingDescription}>Allow high slippage trades</Text>
        </View>
        <Switch
          value={localSettings.expertMode}
          onValueChange={handleExpertModeToggle}
          trackColor={{ false: '#2C2C2E', true: '#FF3B30' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Infinite Approval</Text>
          <Text style={styles.settingDescription}>Approve maximum amount to save gas</Text>
        </View>
        <Switch
          value={localSettings.infiniteApproval}
          onValueChange={(value) => handleSettingChange('infiniteApproval', value)}
          trackColor={{ false: '#2C2C2E', true: '#B1420A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Multi-hop Trading</Text>
          <Text style={styles.settingDescription}>Enable routing through multiple pools</Text>
        </View>
        <Switch
          value={localSettings.multihopEnabled}
          onValueChange={(value) => handleSettingChange('multihopEnabled', value)}
          trackColor={{ false: '#2C2C2E', true: '#B1420A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Auto Slippage</Text>
          <Text style={styles.settingDescription}>Automatically adjust slippage based on market conditions</Text>
        </View>
        <Switch
          value={localSettings.autoSlippageEnabled}
          onValueChange={(value) => handleSettingChange('autoSlippageEnabled', value)}
          trackColor={{ false: '#2C2C2E', true: '#B1420A' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Swap Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {renderSlippageSettings()}
          {renderDeadlineSettings()}
          {renderMevProtectionSettings()}
          {renderGasSettings()}
          {renderAdvancedSettings()}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  presetButtonActive: {
    backgroundColor: '#B1420A',
    borderColor: '#B1420A',
  },
  presetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  customInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    flex: 1,
    textAlign: 'center',
  },
  customInputSuffix: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: 'Poppins',
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 8,
    fontFamily: 'Poppins',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  settingDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  statsText: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  strategyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  strategyButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  strategyButtonActive: {
    backgroundColor: '#B1420A',
    borderColor: '#B1420A',
  },
  strategyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  strategyButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#B1420A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default AdvancedSwapSettings;
