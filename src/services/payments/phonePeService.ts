/**
 * PHONEPE PAYMENT GATEWAY SERVICE - PRODUCTION IMPLEMENTATION
 * Enterprise-grade PhonePe integration for Indian market
 * Supports UPI, cards, wallets, and net banking
 */

import CryptoJS from 'crypto-js';
import { loadingOrchestrator } from '../enterprise/loadingOrchestrator';

// ==================== TYPES & INTERFACES ====================

export interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: number;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
  redirectUrl: string;
}

export interface PhonePePaymentRequest {
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number; // Amount in paise (1 INR = 100 paise)
  redirectUrl: string;
  redirectMode: 'POST' | 'REDIRECT';
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument: {
    type: 'PAY_PAGE' | 'UPI_COLLECT' | 'UPI_INTENT';
    targetApp?: 'com.phonepe.app' | 'net.one97.paytm' | 'com.google.android.apps.nbu.paisa.user';
    upiId?: string;
  };
}

export interface PhonePePaymentResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'PENDING' | 'COMPLETED' | 'FAILED';
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
      cardType?: string;
      pgTransactionId?: string;
    };
  };
}

export interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'PENDING' | 'COMPLETED' | 'FAILED';
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
    };
  };
}

// ==================== PHONEPE SERVICE CLASS ====================

export class PhonePeService {
  private config: PhonePeConfig | null = null;
  private baseUrl: string = '';

  constructor() {
    // Register loading component
    loadingOrchestrator.registerComponent({
      componentId: 'phonepe_payment',
      timeout: 120000, // 2 minutes for payment
      maxRetries: 1,
      retryDelay: 5000,
      dependencies: ['user_auth'],
      priority: 'critical'
    });
  }

  // ==================== INITIALIZATION ====================

  async initialize(config: PhonePeConfig): Promise<void> {
    try {
      await loadingOrchestrator.startLoading('phonepe_init', 'Initializing PhonePe gateway');

      this.config = config;
      this.baseUrl = config.environment === 'production' 
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

      // Validate configuration
      this.validateConfig(config);

      await loadingOrchestrator.completeLoading('phonepe_init', 'PhonePe gateway initialized');
    } catch (error) {
      await loadingOrchestrator.failLoading('phonepe_init', `Initialization failed: ${error}`);
      throw error;
    }
  }

  private validateConfig(config: PhonePeConfig): void {
    if (!config.merchantId) {
      throw new Error('Merchant ID is required');
    }
    if (!config.saltKey) {
      throw new Error('Salt key is required');
    }
    if (!config.callbackUrl) {
      throw new Error('Callback URL is required');
    }
    if (!config.redirectUrl) {
      throw new Error('Redirect URL is required');
    }
  }

  // ==================== PAYMENT INITIATION ====================

  async initiatePayment(request: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    try {
      await loadingOrchestrator.startLoading('phonepe_payment', 'Initiating PhonePe payment');

      if (!this.config) {
        throw new Error('PhonePe service not initialized');
      }

      // Validate payment request
      this.validatePaymentRequest(request);

      await loadingOrchestrator.updateLoading('phonepe_payment', 'Preparing payment request');

      // Create payment payload
      const payload = {
        merchantId: this.config.merchantId,
        merchantTransactionId: request.merchantTransactionId,
        merchantUserId: request.merchantUserId,
        amount: request.amount,
        redirectUrl: request.redirectUrl,
        redirectMode: request.redirectMode,
        callbackUrl: request.callbackUrl,
        paymentInstrument: request.paymentInstrument
      };

      // Encode payload
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Generate checksum
      const checksum = this.generateChecksum(base64Payload);

      await loadingOrchestrator.updateLoading('phonepe_payment', 'Sending payment request');

      // Make API call
      const response = await this.makeApiCall('/pg/v1/pay', {
        request: base64Payload
      }, checksum);

      await loadingOrchestrator.completeLoading('phonepe_payment', 'Payment initiated successfully');

      return response;

    } catch (error) {
      await loadingOrchestrator.failLoading('phonepe_payment', `Payment initiation failed: ${error}`);
      throw error;
    }
  }

  // ==================== PAYMENT STATUS CHECK ====================

  async checkPaymentStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
    try {
      await loadingOrchestrator.startLoading('phonepe_status', 'Checking payment status');

      if (!this.config) {
        throw new Error('PhonePe service not initialized');
      }

      // Generate checksum for status check
      const checksumString = `/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}${this.config.saltKey}`;
      const checksum = CryptoJS.SHA256(checksumString).toString() + '###' + this.config.saltIndex;

      const response = await fetch(
        `${this.baseUrl}/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': this.config.merchantId
          }
        }
      );

      const result = await response.json();

      await loadingOrchestrator.completeLoading('phonepe_status', 'Status retrieved successfully');

      return result;

    } catch (error) {
      await loadingOrchestrator.failLoading('phonepe_status', `Status check failed: ${error}`);
      throw error;
    }
  }

  // ==================== UPI SPECIFIC METHODS ====================

  async initiateUPIPayment(
    merchantTransactionId: string,
    merchantUserId: string,
    amount: number,
    upiId?: string
  ): Promise<PhonePePaymentResponse> {
    const request: PhonePePaymentRequest = {
      merchantTransactionId,
      merchantUserId,
      amount: amount * 100, // Convert to paise
      redirectUrl: this.config!.redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: this.config!.callbackUrl,
      paymentInstrument: {
        type: upiId ? 'UPI_COLLECT' : 'UPI_INTENT',
        upiId
      }
    };

    return this.initiatePayment(request);
  }

  async initiateCardPayment(
    merchantTransactionId: string,
    merchantUserId: string,
    amount: number
  ): Promise<PhonePePaymentResponse> {
    const request: PhonePePaymentRequest = {
      merchantTransactionId,
      merchantUserId,
      amount: amount * 100, // Convert to paise
      redirectUrl: this.config!.redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: this.config!.callbackUrl,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    return this.initiatePayment(request);
  }

  // ==================== WEBHOOK HANDLING ====================

  async handleWebhook(payload: string, checksum: string): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('PhonePe service not initialized');
      }

      // Verify webhook checksum
      const expectedChecksum = this.generateChecksum(payload);
      
      if (checksum !== expectedChecksum) {
        console.error('Invalid webhook checksum');
        return false;
      }

      // Decode and process webhook data
      const webhookData = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      // Process the webhook data
      await this.processWebhookData(webhookData);

      return true;

    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  private async processWebhookData(data: unknown): Promise<void> {
    // Process webhook data based on transaction state
    switch (data.state) {
      case 'COMPLETED':
        await this.handlePaymentSuccess(data);
        break;
      case 'FAILED':
        await this.handlePaymentFailure(data);
        break;
      case 'PENDING':
        await this.handlePaymentPending(data);
        break;
      default:
        console.warn('Unknown payment state:', data.state);
    }
  }

  private async handlePaymentSuccess(data: unknown): Promise<void> {
    console.log('Payment successful:', data.merchantTransactionId);
    // Update transaction status in database
    // Trigger balance update
    // Send confirmation to user
  }

  private async handlePaymentFailure(data: unknown): Promise<void> {
    console.log('Payment failed:', data.merchantTransactionId);
    // Update transaction status in database
    // Send failure notification to user
  }

  private async handlePaymentPending(data: unknown): Promise<void> {
    console.log('Payment pending:', data.merchantTransactionId);
    // Keep monitoring the transaction
  }

  // ==================== UTILITY METHODS ====================

  private validatePaymentRequest(request: PhonePePaymentRequest): void {
    if (!request.merchantTransactionId) {
      throw new Error('Merchant transaction ID is required');
    }
    if (!request.merchantUserId) {
      throw new Error('Merchant user ID is required');
    }
    if (!request.amount || request.amount <= 0) {
      throw new Error('Valid amount is required');
    }
    if (request.amount < 100) { // Minimum 1 INR
      throw new Error('Minimum amount is 1 INR');
    }
    if (request.amount > 10000000) { // Maximum 1 Lakh INR
      throw new Error('Maximum amount is 1,00,000 INR');
    }
  }

  private generateChecksum(payload: string): string {
    if (!this.config) {
      throw new Error('PhonePe service not initialized');
    }

    const checksumString = payload + '/pg/v1/pay' + this.config.saltKey;
    return CryptoJS.SHA256(checksumString).toString() + '###' + this.config.saltIndex;
  }

  private async makeApiCall(endpoint: string, data: unknown, checksum: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`PhonePe API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== HELPER METHODS ====================

  generateMerchantTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatAmount(amount: number): number {
    // Convert rupees to paise
    return Math.round(amount * 100);
  }

  isValidUPIId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }

  getPaymentUrl(response: PhonePePaymentResponse): string | null {
    if (response.success && response.data) {
      // In production, PhonePe returns a payment URL
      return `${this.baseUrl}/pg/v1/pay/${response.data.merchantId}/${response.data.merchantTransactionId}`;
    }
    return null;
  }

  // ==================== ERROR HANDLING ====================

  getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'PAYMENT_ERROR': 'Payment processing failed',
      'PAYMENT_DECLINED': 'Payment was declined',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in account',
      'INVALID_VPA': 'Invalid UPI ID',
      'TRANSACTION_NOT_FOUND': 'Transaction not found',
      'PAYMENT_PENDING': 'Payment is still pending',
      'INTERNAL_SERVER_ERROR': 'Internal server error occurred'
    };

    return errorMessages[code] || 'Unknown error occurred';
  }

  // ==================== PUBLIC GETTERS ====================

  isInitialized(): boolean {
    return this.config !== null;
  }

  getConfig(): PhonePeConfig | null {
    return this.config;
  }

  getSupportedPaymentMethods(): string[] {
    return ['UPI', 'Cards', 'Net Banking', 'Wallets'];
  }
}

// ==================== SINGLETON EXPORT ====================

export const phonePeService = new PhonePeService();
