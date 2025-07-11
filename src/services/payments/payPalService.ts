/**
 * PAYPAL PAYMENT GATEWAY SERVICE - PRODUCTION IMPLEMENTATION
 * Enterprise-grade PayPal integration for global market
 * Supports PayPal payments, credit cards, and digital wallets
 */

import { loadingOrchestrator } from '../enterprise/loadingOrchestrator';

// ==================== TYPES & INTERFACES ====================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  webhookId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalPaymentRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  amount: {
    currency_code: string;
    value: string;
  };
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  soft_descriptor?: string;
  items?: PayPalItem[];
  shipping?: PayPalShipping;
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'CONTINUE' | 'PAY_NOW';
    return_url?: string;
    cancel_url?: string;
  };
}

export interface PayPalItem {
  name: string;
  quantity: string;
  description?: string;
  sku?: string;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS';
  unit_amount: {
    currency_code: string;
    value: string;
  };
}

export interface PayPalShipping {
  name?: {
    full_name: string;
  };
  address?: {
    address_line_1: string;
    address_line_2?: string;
    admin_area_2: string; // City
    admin_area_1: string; // State
    postal_code: string;
    country_code: string;
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  create_time: string;
  update_time: string;
}

export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED';
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture: boolean;
  seller_protection: {
    status: string;
    dispute_categories: string[];
  };
  create_time: string;
  update_time: string;
}

export interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

// ==================== PAYPAL SERVICE CLASS ====================

export class PayPalService {
  private config: PayPalConfig | null = null;
  private baseUrl: string = '';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // Register loading component
    loadingOrchestrator.registerComponent({
      componentId: 'paypal_payment',
      timeout: 180000, // 3 minutes for PayPal
      maxRetries: 1,
      retryDelay: 5000,
      dependencies: ['user_auth'],
      priority: 'critical'
    });
  }

  // ==================== INITIALIZATION ====================

  async initialize(config: PayPalConfig): Promise<void> {
    try {
      await loadingOrchestrator.startLoading('paypal_init', 'Initializing PayPal gateway');

      this.config = config;
      this.baseUrl = config.environment === 'live' 
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      // Validate configuration
      this.validateConfig(config);

      // Get initial access token
      await this.getAccessToken();

      await loadingOrchestrator.completeLoading('paypal_init', 'PayPal gateway initialized');
    } catch (error) {
      await loadingOrchestrator.failLoading('paypal_init', `Initialization failed: ${error}`);
      throw error;
    }
  }

  private validateConfig(config: PayPalConfig): void {
    if (!config.clientId) {
      throw new Error('Client ID is required');
    }
    if (!config.clientSecret) {
      throw new Error('Client secret is required');
    }
    if (!config.returnUrl) {
      throw new Error('Return URL is required');
    }
    if (!config.cancelUrl) {
      throw new Error('Cancel URL is required');
    }
  }

  // ==================== AUTHENTICATION ====================

  private async getAccessToken(): Promise<string> {
    try {
      // Check if current token is still valid
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      if (!this.config) {
        throw new Error('PayPal service not initialized');
      }

      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`PayPal authentication failed: ${response.status}`);
      }

      const tokenData: PayPalAccessToken = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;

    } catch (error) {
      console.error('PayPal authentication error:', error);
      throw error;
    }
  }

  // ==================== ORDER CREATION ====================

  async createOrder(request: PayPalPaymentRequest): Promise<PayPalOrderResponse> {
    try {
      await loadingOrchestrator.startLoading('paypal_payment', 'Creating PayPal order');

      if (!this.config) {
        throw new Error('PayPal service not initialized');
      }

      // Validate payment request
      this.validatePaymentRequest(request);

      await loadingOrchestrator.updateLoading('paypal_payment', 'Preparing order details');

      // Get access token
      const token = await this.getAccessToken();

      // Create order payload
      const orderPayload = {
        intent: request.intent,
        purchase_units: [{
          amount: request.amount,
          description: request.description,
          custom_id: request.custom_id,
          invoice_id: request.invoice_id,
          soft_descriptor: request.soft_descriptor,
          items: request.items,
          shipping: request.shipping
        }],
        application_context: {
          brand_name: request.application_context?.brand_name || 'DEX Mobile',
          locale: request.application_context?.locale || 'en-US',
          landing_page: request.application_context?.landing_page || 'NO_PREFERENCE',
          shipping_preference: request.application_context?.shipping_preference || 'NO_SHIPPING',
          user_action: request.application_context?.user_action || 'PAY_NOW',
          return_url: request.application_context?.return_url || this.config.returnUrl,
          cancel_url: request.application_context?.cancel_url || this.config.cancelUrl
        }
      };

      await loadingOrchestrator.updateLoading('paypal_payment', 'Sending order to PayPal');

      // Make API call
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': this.generateRequestId()
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal order creation failed: ${errorData.message || response.statusText}`);
      }

      const orderData: PayPalOrderResponse = await response.json();

      await loadingOrchestrator.completeLoading('paypal_payment', 'Order created successfully');

      return orderData;

    } catch (error) {
      await loadingOrchestrator.failLoading('paypal_payment', `Order creation failed: ${error}`);
      throw error;
    }
  }

  // ==================== ORDER CAPTURE ====================

  async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    try {
      await loadingOrchestrator.startLoading('paypal_capture', 'Capturing PayPal payment');

      if (!this.config) {
        throw new Error('PayPal service not initialized');
      }

      // Get access token
      const token = await this.getAccessToken();

      await loadingOrchestrator.updateLoading('paypal_capture', 'Processing payment capture');

      // Capture the order
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': this.generateRequestId()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal capture failed: ${errorData.message || response.statusText}`);
      }

      const captureData = await response.json();

      await loadingOrchestrator.completeLoading('paypal_capture', 'Payment captured successfully');

      return captureData.purchase_units[0].payments.captures[0];

    } catch (error) {
      await loadingOrchestrator.failLoading('paypal_capture', `Payment capture failed: ${error}`);
      throw error;
    }
  }

  // ==================== ORDER STATUS ====================

  async getOrderDetails(orderId: string): Promise<PayPalOrderResponse> {
    try {
      if (!this.config) {
        throw new Error('PayPal service not initialized');
      }

      // Get access token
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PayPal order details failed: ${response.statusText}`);
      }

      return response.json();

    } catch (error) {
      console.error('PayPal order details error:', error);
      throw error;
    }
  }

  // ==================== WEBHOOK HANDLING ====================

  async handleWebhook(headers: Record<string, string>, body: string): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('PayPal service not initialized');
      }

      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(headers, body);
      
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        return false;
      }

      // Process webhook data
      const webhookData = JSON.parse(body);
      await this.processWebhookEvent(webhookData);

      return true;

    } catch (error) {
      console.error('PayPal webhook processing failed:', error);
      return false;
    }
  }

  private async verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
    try {
      if (!this.config) {
        return false;
      }

      const token = await this.getAccessToken();

      const verificationPayload = {
        auth_algo: headers['paypal-auth-algo'],
        cert_id: headers['paypal-cert-id'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: this.config.webhookId,
        webhook_event: JSON.parse(body)
      };

      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationPayload)
      });

      const result = await response.json();
      return result.verification_status === 'SUCCESS';

    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  private async processWebhookEvent(event: any): Promise<void> {
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await this.handleOrderApproved(event);
        break;
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePaymentCompleted(event);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await this.handlePaymentDenied(event);
        break;
      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }
  }

  private async handleOrderApproved(event: any): Promise<void> {
    console.log('PayPal order approved:', event.resource.id);
    // Update order status in database
  }

  private async handlePaymentCompleted(event: any): Promise<void> {
    console.log('PayPal payment completed:', event.resource.id);
    // Update transaction status in database
    // Trigger balance update
    // Send confirmation to user
  }

  private async handlePaymentDenied(event: any): Promise<void> {
    console.log('PayPal payment denied:', event.resource.id);
    // Update transaction status in database
    // Send failure notification to user
  }

  // ==================== UTILITY METHODS ====================

  private validatePaymentRequest(request: PayPalPaymentRequest): void {
    if (!request.amount || !request.amount.value || !request.amount.currency_code) {
      throw new Error('Valid amount with currency is required');
    }

    const amount = parseFloat(request.amount.value);
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount < 0.01) {
      throw new Error('Minimum amount is 0.01');
    }

    if (amount > 10000) {
      throw new Error('Maximum amount is 10,000');
    }

    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    if (!supportedCurrencies.includes(request.amount.currency_code)) {
      throw new Error(`Currency ${request.amount.currency_code} is not supported`);
    }
  }

  private generateRequestId(): string {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== HELPER METHODS ====================

  getApprovalUrl(orderResponse: PayPalOrderResponse): string | null {
    const approvalLink = orderResponse.links.find(link => link.rel === 'approve');
    return approvalLink ? approvalLink.href : null;
  }

  formatAmount(amount: number, currency: string = 'USD'): { currency_code: string; value: string } {
    return {
      currency_code: currency,
      value: amount.toFixed(2)
    };
  }

  isValidCurrency(currency: string): boolean {
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    return supportedCurrencies.includes(currency);
  }

  // ==================== ERROR HANDLING ====================

  getErrorMessage(error: any): string {
    if (error.details && error.details.length > 0) {
      return error.details[0].description || error.message;
    }
    return error.message || 'Unknown PayPal error occurred';
  }

  // ==================== PUBLIC GETTERS ====================

  isInitialized(): boolean {
    return this.config !== null;
  }

  getConfig(): PayPalConfig | null {
    return this.config;
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  }

  getSupportedPaymentMethods(): string[] {
    return ['PayPal', 'Credit Card', 'Debit Card', 'Bank Transfer'];
  }
}

// ==================== SINGLETON EXPORT ====================

export const payPalService = new PayPalService();
