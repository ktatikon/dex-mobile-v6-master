/**
 * TRANSACTION PROGRESS TRACKER COMPONENT - ENTERPRISE IMPLEMENTATION
 * Comprehensive transaction tracking with approval, swap, and confirmation states
 * Integrates with enterprise loading patterns and provides real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadingOrchestrator } from '../../services/enterprise/loadingOrchestrator';
import { blockchainService } from '../../services/blockchainService';

// ==================== TYPES & INTERFACES ====================

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  estimatedTime?: number; // seconds
  actualTime?: number; // seconds
  error?: string;
  retryable?: boolean;
}

export interface TransactionProgressData {
  steps: TransactionStep[];
  currentStepIndex: number;
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  totalEstimatedTime: number;
  networkId: string;
  fromToken: {
    symbol: string;
    amount: string;
  };
  toToken: {
    symbol: string;
    amount?: string;
  };
}

export interface TransactionProgressTrackerProps {
  visible: boolean;
  onClose: () => void;
  progressData: TransactionProgressData | null;
  onRetry?: (stepId: string) => void;
  onCancel?: () => void;
  networkId: string;
}

// ==================== COMPONENT ====================

export const TransactionProgressTracker: React.FC<TransactionProgressTrackerProps> = ({
  visible,
  onClose,
  progressData,
  onRetry,
  onCancel,
  networkId
}) => {
  const [animatedValues] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (visible && progressData) {
      startProgressAnimation();
      startTimeTracking();
    }
  }, [visible, progressData]);

  useEffect(() => {
    if (progressData) {
      updateProgressAnimation();
      updateTimeEstimates();
    }
  }, [progressData?.currentStepIndex, progressData?.steps]);

  // ==================== ANIMATION ====================

  const startProgressAnimation = useCallback(() => {
    animatedValues.forEach((value, index) => {
      value.setValue(0);
      if (progressData && index <= progressData.currentStepIndex) {
        Animated.timing(value, {
          toValue: 1,
          duration: 500,
          delay: index * 200,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [animatedValues, progressData]);

  const updateProgressAnimation = useCallback(() => {
    if (!progressData) return;

    animatedValues.forEach((value, index) => {
      if (index <= progressData.currentStepIndex) {
        Animated.timing(value, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [animatedValues, progressData]);

  // ==================== TIME TRACKING ====================

  const startTimeTracking = useCallback(() => {
    const interval = setInterval(() => {
      if (!progressData) return;

      const now = new Date();
      const elapsed = Math.floor((now.getTime() - progressData.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);

      // Calculate estimated time remaining
      const completedSteps = progressData.steps.filter(step => step.status === 'completed').length;
      const totalSteps = progressData.steps.length;
      const avgTimePerStep = elapsed / Math.max(1, completedSteps);
      const remainingSteps = totalSteps - completedSteps;
      const estimated = Math.max(0, remainingSteps * avgTimePerStep);
      setEstimatedTimeRemaining(Math.floor(estimated));

      // Clear interval if transaction is complete
      if (progressData.overallStatus === 'completed' || progressData.overallStatus === 'failed') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [progressData]);

  const updateTimeEstimates = useCallback(() => {
    if (!progressData) return;

    const currentStep = progressData.steps[progressData.currentStepIndex];
    if (currentStep && currentStep.estimatedTime) {
      setEstimatedTimeRemaining(currentStep.estimatedTime);
    }
  }, [progressData]);

  // ==================== UTILITY FUNCTIONS ====================

  const getStepIcon = (step: TransactionStep, index: number): string => {
    switch (step.status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'processing':
        return 'time';
      default:
        return 'ellipse-outline';
    }
  };

  const getStepColor = (step: TransactionStep): string => {
    switch (step.status) {
      case 'completed':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      case 'processing':
        return '#B1420A';
      default:
        return '#8E8E93';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getBlockExplorerUrl = (txHash: string): string => {
    const explorers: Record<string, string> = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      bsc: 'https://bscscan.com/tx/',
    };
    return `${explorers[networkId] || explorers.ethereum}${txHash}`;
  };

  const handleViewTransaction = (txHash: string) => {
    const url = getBlockExplorerUrl(txHash);
    Linking.openURL(url);
  };

  // ==================== RENDER HELPERS ====================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Transaction Progress</Text>
        {progressData && (
          <Text style={styles.subtitle}>
            {progressData.fromToken.amount} {progressData.fromToken.symbol} → {progressData.toToken.symbol}
          </Text>
        )}
      </View>
      
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderProgressOverview = () => {
    if (!progressData) return null;

    const completedSteps = progressData.steps.filter(step => step.status === 'completed').length;
    const totalSteps = progressData.steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completedSteps} of {totalSteps} steps completed
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Elapsed</Text>
            <Text style={styles.timeValue}>{formatTime(elapsedTime)}</Text>
          </View>
          {estimatedTimeRemaining > 0 && (
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Remaining</Text>
              <Text style={styles.timeValue}>{formatTime(estimatedTimeRemaining)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSteps = () => {
    if (!progressData) return null;

    return (
      <View style={styles.stepsContainer}>
        {progressData.steps.map((step, index) => (
          <Animated.View
            key={step.id}
            style={[
              styles.stepContainer,
              {
                opacity: animatedValues[index],
                transform: [{
                  translateX: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.stepIconContainer}>
              <Ionicons
                name={getStepIcon(step, index)}
                size={24}
                color={getStepColor(step)}
              />
              {index < progressData.steps.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  { backgroundColor: step.status === 'completed' ? '#34C759' : '#2C2C2E' }
                ]} />
              )}
            </View>

            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.status === 'processing' && (
                  <View style={styles.processingIndicator}>
                    <View style={styles.processingDot} />
                    <View style={[styles.processingDot, { animationDelay: '0.2s' }]} />
                    <View style={[styles.processingDot, { animationDelay: '0.4s' }]} />
                  </View>
                )}
              </View>

              <Text style={styles.stepDescription}>{step.description}</Text>

              {step.transactionHash && (
                <TouchableOpacity
                  style={styles.txHashContainer}
                  onPress={() => handleViewTransaction(step.transactionHash!)}
                >
                  <Text style={styles.txHashText}>
                    {step.transactionHash.slice(0, 10)}...{step.transactionHash.slice(-8)}
                  </Text>
                  <Ionicons name="open-outline" size={14} color="#B1420A" />
                </TouchableOpacity>
              )}

              {step.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{step.error}</Text>
                  {step.retryable && onRetry && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => onRetry(step.id)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {step.estimatedTime && step.status === 'processing' && (
                <Text style={styles.estimatedTime}>
                  Est. {formatTime(step.estimatedTime)}
                </Text>
              )}

              {step.actualTime && step.status === 'completed' && (
                <Text style={styles.actualTime}>
                  Completed in {formatTime(step.actualTime)}
                </Text>
              )}
            </View>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderFooter = () => {
    if (!progressData) return null;

    const isCompleted = progressData.overallStatus === 'completed';
    const isFailed = progressData.overallStatus === 'failed';
    const isProcessing = progressData.overallStatus === 'processing';

    return (
      <View style={styles.footer}>
        {isCompleted && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#34C759" />
            <Text style={styles.successText}>Transaction Completed!</Text>
            {progressData.toToken.amount && (
              <Text style={styles.successAmount}>
                Received {progressData.toToken.amount} {progressData.toToken.symbol}
              </Text>
            )}
          </View>
        )}

        {isFailed && (
          <View style={styles.failureContainer}>
            <Ionicons name="close-circle" size={32} color="#FF3B30" />
            <Text style={styles.failureText}>Transaction Failed</Text>
            <Text style={styles.failureDescription}>
              Your funds are safe. Please try again.
            </Text>
          </View>
        )}

        {isProcessing && onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.closeFooterButton, isCompleted && styles.closeFooterButtonSuccess]}
          onPress={onClose}
        >
          <Text style={styles.closeFooterButtonText}>
            {isCompleted ? 'Done' : 'Close'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!visible || !progressData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {renderHeader()}
          {renderProgressOverview()}
          {renderSteps()}
          {renderFooter()}
        </View>
      </View>
    </Modal>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 4,
  },
  overviewContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#B1420A',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  stepsContainer: {
    padding: 16,
    maxHeight: 300,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  processingIndicator: {
    flexDirection: 'row',
    gap: 2,
  },
  processingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B1420A',
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  txHashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  txHashText: {
    fontSize: 12,
    color: '#B1420A',
    marginRight: 4,
    fontFamily: 'Poppins',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    fontFamily: 'Poppins',
  },
  actualTime: {
    fontSize: 12,
    color: '#34C759',
    fontFamily: 'Poppins',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  successAmount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  failureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  failureText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  failureDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  cancelButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  closeFooterButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonSuccess: {
    backgroundColor: '#B1420A',
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default TransactionProgressTracker;
