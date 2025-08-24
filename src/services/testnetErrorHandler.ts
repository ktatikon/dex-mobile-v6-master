/**
 * Testnet Error Handler Service
 * Comprehensive error handling and user-friendly error messages for testnet operations
 */

export interface TestnetError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedAction?: string;
}

export class TestnetErrorHandler {
  private static readonly ERROR_CODES = {
    // Network Errors
    NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
    RPC_CONNECTION_FAILED: 'RPC_CONNECTION_FAILED',
    NETWORK_CONGESTION: 'NETWORK_CONGESTION',
    
    // Wallet Errors
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
    WALLET_CREATION_FAILED: 'WALLET_CREATION_FAILED',
    
    // Transaction Errors
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_ADDRESS: 'INVALID_ADDRESS',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
    NONCE_TOO_LOW: 'NONCE_TOO_LOW',
    GAS_PRICE_TOO_LOW: 'GAS_PRICE_TOO_LOW',
    
    // Permission Errors
    ACCESS_DENIED: 'ACCESS_DENIED',
    ADMIN_REQUIRED: 'ADMIN_REQUIRED',
    
    // Database Errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
    
    // General Errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  };

  /**
   * Handle and categorize errors
   */
  static handleError(error: unknown): TestnetError {
    // Check for specific error patterns
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handleEthersError(error as Record<string, unknown>);
    }
    
    if (error?.message) {
      return this.handleMessageError(error.message);
    }
    
    if (typeof error === 'string') {
      return this.handleStringError(error);
    }
    
    return this.createError(
      this.ERROR_CODES.UNKNOWN_ERROR,
      'An unknown error occurred',
      'Something went wrong. Please try again.',
      'medium',
      true,
      'Refresh the page and try again'
    );
  }

  /**
   * Handle ethers.js specific errors
   */
  private static handleEthersError(error: Record<string, unknown>): TestnetError {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return this.createError(
          this.ERROR_CODES.NETWORK_UNAVAILABLE,
          'Network connection failed',
          'Unable to connect to the blockchain network',
          'high',
          true,
          'Check your internet connection and try again'
        );
        
      case 'INSUFFICIENT_FUNDS':
        return this.createError(
          this.ERROR_CODES.INSUFFICIENT_BALANCE,
          'Insufficient funds for transaction',
          'You don\'t have enough ETH to complete this transaction',
          'medium',
          true,
          'Get test ETH from the faucet or reduce the transaction amount'
        );
        
      case 'UNPREDICTABLE_GAS_LIMIT':
        return this.createError(
          this.ERROR_CODES.GAS_ESTIMATION_FAILED,
          'Gas estimation failed',
          'Unable to estimate transaction fees',
          'medium',
          true,
          'Try again with a different amount or check the recipient address'
        );
        
      case 'NONCE_EXPIRED':
      case 'REPLACEMENT_UNDERPRICED':
        return this.createError(
          this.ERROR_CODES.NONCE_TOO_LOW,
          'Transaction nonce issue',
          'Transaction conflict detected',
          'medium',
          true,
          'Wait a moment and try again'
        );
        
      case 'TIMEOUT':
        return this.createError(
          this.ERROR_CODES.TRANSACTION_TIMEOUT,
          'Transaction timeout',
          'Transaction is taking longer than expected',
          'medium',
          true,
          'Check the transaction status on the block explorer'
        );
        
      default:
        return this.handleMessageError(error.message || error.reason || 'Unknown ethers error');
    }
  }

  /**
   * Handle errors based on message content
   */
  private static handleMessageError(message: string): TestnetError {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('insufficient funds') || lowerMessage.includes('insufficient balance')) {
      return this.createError(
        this.ERROR_CODES.INSUFFICIENT_BALANCE,
        message,
        'You don\'t have enough ETH for this transaction',
        'medium',
        true,
        'Get test ETH from the faucet'
      );
    }
    
    if (lowerMessage.includes('invalid address')) {
      return this.createError(
        this.ERROR_CODES.INVALID_ADDRESS,
        message,
        'The recipient address is not valid',
        'medium',
        true,
        'Check the address format and try again'
      );
    }
    
    if (lowerMessage.includes('network') && lowerMessage.includes('unavailable')) {
      return this.createError(
        this.ERROR_CODES.NETWORK_UNAVAILABLE,
        message,
        'Blockchain network is currently unavailable',
        'high',
        true,
        'Try again in a few minutes'
      );
    }
    
    if (lowerMessage.includes('access denied') || lowerMessage.includes('unauthorized')) {
      return this.createError(
        this.ERROR_CODES.ACCESS_DENIED,
        message,
        'You don\'t have permission to perform this action',
        'high',
        false,
        'Contact your administrator for access'
      );
    }
    
    if (lowerMessage.includes('wallet not found')) {
      return this.createError(
        this.ERROR_CODES.WALLET_NOT_FOUND,
        message,
        'Wallet could not be found',
        'high',
        true,
        'Try refreshing the page or creating a new wallet'
      );
    }
    
    if (lowerMessage.includes('private key')) {
      return this.createError(
        this.ERROR_CODES.INVALID_PRIVATE_KEY,
        message,
        'Invalid wallet credentials',
        'critical',
        false,
        'Contact support for assistance'
      );
    }
    
    if (lowerMessage.includes('gas')) {
      return this.createError(
        this.ERROR_CODES.GAS_ESTIMATION_FAILED,
        message,
        'Unable to estimate transaction fees',
        'medium',
        true,
        'Try again with a different amount'
      );
    }
    
    return this.createError(
      this.ERROR_CODES.UNKNOWN_ERROR,
      message,
      'An unexpected error occurred',
      'medium',
      true,
      'Try again or contact support if the problem persists'
    );
  }

  /**
   * Handle string errors
   */
  private static handleStringError(error: string): TestnetError {
    return this.handleMessageError(error);
  }

  /**
   * Create a standardized error object
   */
  private static createError(
    code: string,
    message: string,
    userMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    recoverable: boolean,
    suggestedAction?: string
  ): TestnetError {
    return {
      code,
      message,
      userMessage,
      severity,
      recoverable,
      suggestedAction,
    };
  }

  /**
   * Get user-friendly error message with action
   */
  static getUserFriendlyMessage(error: unknown): { title: string; description: string; action?: string } {
    const testnetError = this.handleError(error);
    
    return {
      title: this.getSeverityTitle(testnetError.severity),
      description: testnetError.userMessage,
      action: testnetError.suggestedAction,
    };
  }

  /**
   * Get title based on severity
   */
  private static getSeverityTitle(severity: string): string {
    switch (severity) {
      case 'low':
        return 'Notice';
      case 'medium':
        return 'Warning';
      case 'high':
        return 'Error';
      case 'critical':
        return 'Critical Error';
      default:
        return 'Error';
    }
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    const testnetError = this.handleError(error);
    return testnetError.recoverable;
  }

  /**
   * Get error severity
   */
  static getSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
    const testnetError = this.handleError(error);
    return testnetError.severity;
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: unknown, context?: string): void {
    const testnetError = this.handleError(error);
    const logMessage = `[${testnetError.code}] ${testnetError.message}`;
    
    if (context) {
      console.error(`${context}: ${logMessage}`, error);
    } else {
      console.error(logMessage, error);
    }
    
    // In production, you might want to send critical errors to a monitoring service
    if (testnetError.severity === 'critical') {
      // Send to monitoring service
      console.error('CRITICAL ERROR:', testnetError);
    }
  }
}

export default TestnetErrorHandler;
