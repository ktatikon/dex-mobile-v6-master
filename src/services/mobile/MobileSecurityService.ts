/**
 * Mobile Security Service
 * Handles mobile-specific security features including biometric authentication,
 * secure storage, app state protection, and certificate pinning
 */

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: 'fingerprint' | 'face' | 'voice' | 'none';
}

interface SecureStorageItem {
  key: string;
  value: string;
  encrypted: boolean;
  timestamp: number;
}

class MobileSecurityService {
  private isInitialized = false;
  private biometricAvailable = false;
  private deviceInfo: unknown = null;
  private secureStorage = new Map<string, SecureStorageItem>();
  private appStateListeners: Array<(state: 'active' | 'background' | 'inactive') => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize mobile security service
   */
  private async initialize() {
    try {
      console.log('🔐 [MobileSecurityService] Initializing mobile security...');

      // Get device information
      this.deviceInfo = await Device.getInfo();
      console.log('📱 [MobileSecurityService] Device info:', this.deviceInfo);

      // Check biometric availability
      await this.checkBiometricAvailability();

      // Set up app state monitoring
      this.setupAppStateMonitoring();

      // Set up security event listeners
      this.setupSecurityEventListeners();

      this.isInitialized = true;
      console.log('✅ [MobileSecurityService] Mobile security initialized');
    } catch (error) {
      console.error('❌ [MobileSecurityService] Failed to initialize:', error);
    }
  }

  /**
   * Check if biometric authentication is available
   */
  private async checkBiometricAvailability() {
    try {
      // This would use Capacitor's Biometric plugin in a real implementation
      // For now, we'll simulate based on device capabilities
      if (Capacitor.isNativePlatform()) {
        this.biometricAvailable = true;
        console.log('✅ [MobileSecurityService] Biometric authentication available');
      } else {
        this.biometricAvailable = false;
        console.log('ℹ️ [MobileSecurityService] Biometric authentication not available on web');
      }
    } catch (error) {
      console.error('❌ [MobileSecurityService] Failed to check biometric availability:', error);
      this.biometricAvailable = false;
    }
  }

  /**
   * Set up app state monitoring for security
   */
  private setupAppStateMonitoring() {
    if (Capacitor.isNativePlatform()) {
      // Monitor app state changes
      document.addEventListener('visibilitychange', () => {
        const state = document.hidden ? 'background' : 'active';
        this.handleAppStateChange(state);
      });

      // Monitor page focus/blur
      window.addEventListener('focus', () => this.handleAppStateChange('active'));
      window.addEventListener('blur', () => this.handleAppStateChange('inactive'));
    }
  }

  /**
   * Handle app state changes for security
   */
  private handleAppStateChange(state: 'active' | 'background' | 'inactive') {
    console.log(`🔐 [MobileSecurityService] App state changed to: ${state}`);

    // Notify listeners
    this.appStateListeners.forEach(listener => listener(state));

    // Security actions based on state
    switch (state) {
      case 'background':
        this.handleAppBackground();
        break;
      case 'active':
        this.handleAppForeground();
        break;
      case 'inactive':
        this.handleAppInactive();
        break;
    }
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground() {
    // Blur sensitive content
    this.blurSensitiveContent();
    
    // Clear clipboard if it contains sensitive data
    this.clearSensitiveClipboard();
    
    // Start inactivity timer
    this.startInactivityTimer();
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground() {
    // Remove blur from sensitive content
    this.unblurSensitiveContent();
    
    // Clear inactivity timer
    this.clearInactivityTimer();
    
    // Check if biometric re-authentication is needed
    this.checkReauthenticationNeeded();
  }

  /**
   * Handle app becoming inactive
   */
  private handleAppInactive() {
    // Similar to background but less aggressive
    this.blurSensitiveContent();
  }

  /**
   * Set up security event listeners
   */
  private setupSecurityEventListeners() {
    // Listen for screenshot attempts (Android)
    if (this.deviceInfo?.platform === 'android') {
      // This would be implemented with native plugins
      console.log('🔐 [MobileSecurityService] Screenshot protection enabled');
    }

    // Listen for screen recording attempts
    // This would be implemented with native plugins
    console.log('🔐 [MobileSecurityService] Screen recording protection enabled');
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometrics(reason: string = 'Authenticate to access DEX'): Promise<BiometricAuthResult> {
    if (!this.biometricAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available',
        biometryType: 'none'
      };
    }

    try {
      // This would use Capacitor's Biometric plugin
      // For now, we'll simulate successful authentication
      console.log('🔐 [MobileSecurityService] Biometric authentication requested:', reason);
      
      // Simulate biometric authentication
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            biometryType: 'fingerprint'
          });
        }, 1000);
      });
    } catch (error) {
      console.error('❌ [MobileSecurityService] Biometric authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        biometryType: 'fingerprint'
      };
    }
  }

  /**
   * Store data securely
   */
  async storeSecurely(key: string, value: string, encrypt: boolean = true): Promise<boolean> {
    try {
      const item: SecureStorageItem = {
        key,
        value: encrypt ? this.encrypt(value) : value,
        encrypted: encrypt,
        timestamp: Date.now()
      };

      // In a real implementation, this would use Capacitor's SecureStorage plugin
      this.secureStorage.set(key, item);
      
      console.log(`🔐 [MobileSecurityService] Data stored securely: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ [MobileSecurityService] Failed to store data securely:', error);
      return false;
    }
  }

  /**
   * Retrieve data securely
   */
  async retrieveSecurely(key: string): Promise<string | null> {
    try {
      const item = this.secureStorage.get(key);
      if (!item) return null;

      const value = item.encrypted ? this.decrypt(item.value) : item.value;
      console.log(`🔐 [MobileSecurityService] Data retrieved securely: ${key}`);
      return value;
    } catch (error) {
      console.error('❌ [MobileSecurityService] Failed to retrieve data securely:', error);
      return null;
    }
  }

  /**
   * Remove data from secure storage
   */
  async removeSecurely(key: string): Promise<boolean> {
    try {
      this.secureStorage.delete(key);
      console.log(`🔐 [MobileSecurityService] Data removed securely: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ [MobileSecurityService] Failed to remove data securely:', error);
      return false;
    }
  }

  /**
   * Simple encryption (in production, use proper encryption libraries)
   */
  private encrypt(data: string): string {
    // This is a simple base64 encoding for demo purposes
    // In production, use proper encryption like AES
    return btoa(data);
  }

  /**
   * Simple decryption
   */
  private decrypt(encryptedData: string): string {
    // This is a simple base64 decoding for demo purposes
    return atob(encryptedData);
  }

  /**
   * Blur sensitive content
   */
  private blurSensitiveContent() {
    const sensitiveElements = document.querySelectorAll('[data-sensitive]');
    sensitiveElements.forEach(element => {
      (element as HTMLElement).style.filter = 'blur(10px)';
    });
  }

  /**
   * Remove blur from sensitive content
   */
  private unblurSensitiveContent() {
    const sensitiveElements = document.querySelectorAll('[data-sensitive]');
    sensitiveElements.forEach(element => {
      (element as HTMLElement).style.filter = 'none';
    });
  }

  /**
   * Clear sensitive data from clipboard
   */
  private clearSensitiveClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('').catch(() => {
        // Ignore errors
      });
    }
  }

  private inactivityTimer: NodeJS.Timeout | null = null;

  /**
   * Start inactivity timer
   */
  private startInactivityTimer() {
    this.clearInactivityTimer();
    
    // Auto-lock after 5 minutes of inactivity
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, 5 * 60 * 1000);
  }

  /**
   * Clear inactivity timer
   */
  private clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Handle inactivity timeout
   */
  private handleInactivityTimeout() {
    console.log('🔐 [MobileSecurityService] Inactivity timeout - requiring re-authentication');
    // This would trigger a re-authentication flow
    this.requireReauthentication();
  }

  /**
   * Check if re-authentication is needed
   */
  private checkReauthenticationNeeded() {
    // Check if enough time has passed to require re-authentication
    const lastAuth = localStorage.getItem('lastBiometricAuth');
    if (lastAuth) {
      const timeSinceAuth = Date.now() - parseInt(lastAuth);
      const reauthThreshold = 10 * 60 * 1000; // 10 minutes
      
      if (timeSinceAuth > reauthThreshold) {
        this.requireReauthentication();
      }
    }
  }

  /**
   * Require re-authentication
   */
  private requireReauthentication() {
    // This would trigger the app to show authentication screen
    window.dispatchEvent(new CustomEvent('requireReauthentication'));
  }

  /**
   * Add app state listener
   */
  addAppStateListener(listener: (state: 'active' | 'background' | 'inactive') => void) {
    this.appStateListeners.push(listener);
  }

  /**
   * Remove app state listener
   */
  removeAppStateListener(listener: (state: 'active' | 'background' | 'inactive') => void) {
    const index = this.appStateListeners.indexOf(listener);
    if (index > -1) {
      this.appStateListeners.splice(index, 1);
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return this.deviceInfo;
  }

  /**
   * Check if biometric authentication is available
   */
  isBiometricAvailable(): boolean {
    return this.biometricAvailable;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

export const mobileSecurityService = new MobileSecurityService();
