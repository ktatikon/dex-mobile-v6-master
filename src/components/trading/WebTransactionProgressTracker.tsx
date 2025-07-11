/**
 * WEB TRANSACTION PROGRESS TRACKER COMPONENT - ENTERPRISE IMPLEMENTATION
 * Web-compatible version using Shadcn/UI components
 * Real-time transaction monitoring with step-by-step progress, retry mechanisms, and detailed status
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Copy,
  ArrowRight,
  Zap
} from 'lucide-react';

// ==================== TYPES & INTERFACES ====================

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number; // seconds
  actualTime?: number; // seconds
  error?: string;
  txHash?: string;
  retryable?: boolean;
}

export interface TransactionProgressData {
  steps: TransactionStep[];
  currentStepIndex: number;
  overallStatus: 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  totalEstimatedTime: number; // seconds
  networkId: string;
  fromToken?: {
    symbol: string;
    amount?: string;
  };
  toToken?: {
    symbol: string;
    amount?: string;
  };
  transactionHash?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface WebTransactionProgressTrackerProps {
  visible: boolean;
  progressData: TransactionProgressData | null;
  onClose: () => void;
  onRetry: (stepId: string) => void;
  onCancel: () => void;
  networkId: string;
}

// ==================== COMPONENT ====================

export const WebTransactionProgressTracker: React.FC<WebTransactionProgressTrackerProps> = ({
  visible,
  progressData,
  onClose,
  onRetry,
  onCancel,
  networkId
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!progressData || progressData.overallStatus !== 'processing') return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - progressData.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [progressData]);

  // ==================== HANDLERS ====================

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
    }
  };

  const getExplorerUrl = (hash: string): string => {
    const baseUrls: Record<string, string> = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      bsc: 'https://bscscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/'
    };
    return `${baseUrls[networkId] || baseUrls.ethereum}${hash}`;
  };

  // ==================== RENDER HELPERS ====================

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-dex-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-dex-text-secondary" />;
    }
  };

  const getStepStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'processing': return 'text-dex-primary';
      default: return 'text-dex-text-secondary';
    }
  };

  const calculateProgress = (): number => {
    if (!progressData) return 0;
    
    const completedSteps = progressData.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / progressData.steps.length) * 100;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getOverallStatusIcon = () => {
    if (!progressData) return null;
    
    switch (progressData.overallStatus) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-400" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-yellow-400" />;
      default:
        return <div className="w-6 h-6 border-2 border-dex-primary border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getOverallStatusText = (): string => {
    if (!progressData) return '';
    
    switch (progressData.overallStatus) {
      case 'completed': return 'Transaction Completed';
      case 'failed': return 'Transaction Failed';
      case 'cancelled': return 'Transaction Cancelled';
      default: return 'Processing Transaction';
    }
  };

  if (!progressData) return null;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-dex-dark border-dex-primary/30">
        <DialogHeader>
          <DialogTitle className="text-dex-text-primary flex items-center gap-3">
            {getOverallStatusIcon()}
            {getOverallStatusText()}
          </DialogTitle>
          <DialogDescription className="text-dex-text-secondary">
            {progressData.fromToken && progressData.toToken && (
              <span>
                Swapping {progressData.fromToken.amount} {progressData.fromToken.symbol} → {progressData.toToken.symbol}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dex-text-secondary">Overall Progress</span>
              <span className="text-sm text-dex-text-primary font-medium">
                {Math.round(calculateProgress())}%
              </span>
            </div>
            <Progress 
              value={calculateProgress()} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-dex-text-secondary">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {progressData.overallStatus === 'processing' && (
                <span>Est. remaining: {formatTime(Math.max(0, progressData.totalEstimatedTime - elapsedTime))}</span>
              )}
            </div>
          </div>

          <Separator className="bg-dex-border/30" />

          {/* Step-by-step Progress */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-dex-text-primary">Transaction Steps</h4>
            <div className="space-y-3">
              {progressData.steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className={`text-sm font-medium ${getStepStatusColor(step.status)}`}>
                        {step.title}
                      </h5>
                      {step.status === 'processing' && step.estimatedTime && (
                        <Badge variant="secondary" className="text-xs">
                          ~{formatTime(step.estimatedTime)}
                        </Badge>
                      )}
                      {step.status === 'completed' && step.actualTime && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                          {formatTime(step.actualTime)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-dex-text-secondary mt-1">
                      {step.description}
                    </p>
                    
                    {/* Error Display */}
                    {step.status === 'failed' && step.error && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5" />
                          <div className="text-xs">
                            <div className="text-red-400 font-medium">Error</div>
                            <div className="text-dex-text-secondary mt-1">{step.error}</div>
                          </div>
                        </div>
                        {step.retryable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRetry(step.id)}
                            className="mt-2 h-6 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Transaction Hash */}
                    {step.txHash && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyHash(step.txHash!)}
                          className="h-6 text-xs text-dex-text-secondary hover:text-dex-text-primary"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedHash ? 'Copied!' : 'Copy Hash'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(step.txHash!), '_blank')}
                          className="h-6 text-xs text-dex-text-secondary hover:text-dex-text-primary"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Summary */}
          {progressData.overallStatus === 'completed' && (
            <>
              <Separator className="bg-dex-border/30" />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-dex-text-primary">Transaction Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {progressData.transactionHash && (
                    <div>
                      <span className="text-dex-text-secondary">Transaction Hash:</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-dex-text-primary font-mono">
                          {progressData.transactionHash.slice(0, 10)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyHash(progressData.transactionHash!)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {progressData.gasUsed && (
                    <div>
                      <span className="text-dex-text-secondary">Gas Used:</span>
                      <div className="text-dex-text-primary mt-1">
                        {parseInt(progressData.gasUsed).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {progressData.effectiveGasPrice && (
                    <div>
                      <span className="text-dex-text-secondary">Gas Price:</span>
                      <div className="text-dex-text-primary mt-1">
                        {(parseFloat(progressData.effectiveGasPrice) / 1e9).toFixed(2)} Gwei
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-dex-text-secondary">Total Time:</span>
                    <div className="text-dex-text-primary mt-1">
                      {progressData.endTime ? 
                        formatTime(Math.floor((progressData.endTime.getTime() - progressData.startTime.getTime()) / 1000)) :
                        formatTime(elapsedTime)
                      }
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-dex-border/30">
            {progressData.overallStatus === 'processing' ? (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-dex-primary/30 text-dex-text-secondary"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-dex-text-secondary"
                >
                  Minimize
                </Button>
              </>
            ) : (
              <>
                {progressData.overallStatus === 'failed' && (
                  <Button
                    variant="outline"
                    onClick={() => onRetry('all')}
                    className="border-dex-primary/30 text-dex-primary"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Transaction
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  className={`${
                    progressData.overallStatus === 'completed' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-dex-primary hover:bg-dex-primary/90'
                  } text-white ml-auto`}
                >
                  {progressData.overallStatus === 'completed' ? 'Done' : 'Close'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebTransactionProgressTracker;
