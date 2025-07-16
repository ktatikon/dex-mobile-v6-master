/**
 * KYC API Service - Integration layer for KYC/AML microservices
 * Connects UI components to backend services (ports 4001, 4002)
 */

import { supabase } from '@/integrations/supabase/client';

interface AadhaarValidationResponse {
  success: boolean;
  referenceId?: string;
  message: string;
  data?: unknown;
}

interface OTPVerificationResponse {
  success: boolean;
  kycData?: unknown;
  message: string;
}

interface BiometricCaptureResponse {
  success: boolean;
  kycData?: unknown;
  quality?: number;
  message: string;
}

interface QRScanResponse {
  success: boolean;
  kycData?: unknown;
  message: string;
}

interface AMLRiskAssessmentResponse {
  success: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  recommendations: string[];
  data?: unknown;
}

class KYCApiService {
  private kycBaseURL = 'http://localhost:4001/api/kyc';
  private amlBaseURL = 'http://localhost:4002/api/aml';
  private apiKey = 'super_secure_admin_key_change_in_production';

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Aadhaar Validation
  async validateAadhaar(aadhaarNumber: string): Promise<AadhaarValidationResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/aadhaar/validate`, {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber }),
      });

      return {
        success: true,
        referenceId: response.data?.referenceId,
        message: 'Aadhaar number validated successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Aadhaar validation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Aadhaar validation failed'
      };
    }
  }

  // Initiate Aadhaar OTP
  async initiateAadhaarOTP(aadhaarNumber: string, userId: string): Promise<AadhaarValidationResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/aadhaar/initiate-otp`, {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber, userId }),
      });

      return {
        success: true,
        referenceId: response.data?.referenceId,
        message: 'OTP sent successfully',
        data: response.data
      };
    } catch (error) {
      console.error('OTP initiation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  }

  // Verify Aadhaar OTP
  async verifyAadhaarOTP(referenceId: string, otp: string, userId: string): Promise<OTPVerificationResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/aadhaar/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ referenceId, otp, userId }),
      });

      // Save KYC data to Supabase
      if (response.success && response.data?.kycData) {
        await this.saveKYCDataToSupabase(userId, response.data.kycData, 'aadhaar_otp');
      }

      return {
        success: true,
        kycData: response.data?.kycData,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'OTP verification failed'
      };
    }
  }

  // Resend Aadhaar OTP
  async resendAadhaarOTP(referenceId: string, userId: string): Promise<AadhaarValidationResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/aadhaar/resend-otp`, {
        method: 'POST',
        body: JSON.stringify({ referenceId, userId }),
      });

      return {
        success: true,
        referenceId: response.data?.referenceId,
        message: 'OTP resent successfully',
        data: response.data
      };
    } catch (error) {
      console.error('OTP resend failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend OTP'
      };
    }
  }

  // Biometric Capture
  async captureBiometric(biometricData: string, biometricType: string, userId: string): Promise<BiometricCaptureResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/biometric/capture`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`,
          userId,
          biometricData: {
            type: biometricType,
            format: 'base64',
            template: biometricData,
            quality: Math.floor(Math.random() * 40) + 60, // Mock quality 60-100%
          }
        }),
      });

      // Save KYC data to Supabase
      if (response.success && response.data?.kycData) {
        await this.saveKYCDataToSupabase(userId, response.data.kycData, 'biometric');
      }

      return {
        success: true,
        kycData: response.data?.kycData,
        quality: response.data?.quality,
        message: 'Biometric captured successfully'
      };
    } catch (error) {
      console.error('Biometric capture failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Biometric capture failed'
      };
    }
  }

  // QR Code Scan
  async scanQRCode(qrData: string, userId: string): Promise<QRScanResponse> {
    try {
      const response = await this.makeRequest(`${this.kycBaseURL}/aadhaar/scan-qr`, {
        method: 'POST',
        body: JSON.stringify({ qrData, userId }),
      });

      // Save KYC data to Supabase
      if (response.success && response.data?.kycData) {
        await this.saveKYCDataToSupabase(userId, response.data.kycData, 'qr_scan');
      }

      return {
        success: true,
        kycData: response.data?.kycData,
        message: 'QR code scanned successfully'
      };
    } catch (error) {
      console.error('QR scan failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'QR scan failed'
      };
    }
  }

  // AML Risk Assessment
  async performAMLRiskAssessment(userId: string, personalInfo: unknown): Promise<AMLRiskAssessmentResponse> {
    try {
      const assessmentData = {
        profile: {
          country: personalInfo.country || 'IN',
          customerType: 'individual',
          industry: 'technology',
          accountAge: 0,
          verificationLevel: 'enhanced'
        },
        transactions: {
          dailyVolume: 0,
          monthlyVolume: 0,
          yearlyVolume: 0,
          dailyCount: 0,
          monthlyCount: 0,
          averageAmount: 0,
          velocity: 1.0,
          countries: [personalInfo.country || 'IN'],
          highRiskCountries: []
        },
        behavior: {
          loginFrequency: 'normal',
          deviceChanges: 0,
          locationChanges: 0,
          timePatterns: 'normal'
        },
        compliance: {
          sanctionsMatches: 0,
          pepMatches: 0
        },
        history: {
          incidents: 0
        }
      };

      const response = await this.makeRequest(`${this.amlBaseURL}/risk/assess`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          assessmentData,
          options: { assessmentType: 'comprehensive' }
        }),
      });

      return {
        success: true,
        riskLevel: response.data?.riskLevel || 'LOW',
        riskScore: response.data?.overallScore || 0,
        recommendations: response.data?.recommendations || [],
        data: response.data
      };
    } catch (error) {
      console.error('AML risk assessment failed:', error);
      return {
        success: false,
        riskLevel: 'LOW',
        riskScore: 0,
        recommendations: ['Manual review recommended'],
        message: error instanceof Error ? error.message : 'Risk assessment failed'
      };
    }
  }

  // Save KYC data to Supabase
  private async saveKYCDataToSupabase(userId: string, kycData: unknown, verificationMethod: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Check for existing KYC record
      const { data: existingKyc } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      const kycRecord = {
        user_id: user.user.id,
        first_name: kycData.name?.split(' ')[0] || kycData.firstName,
        last_name: kycData.name?.split(' ').slice(1).join(' ') || kycData.lastName,
        date_of_birth: kycData.dateOfBirth,
        address: kycData.address,
        city: kycData.city,
        state: kycData.state,
        postal_code: kycData.pincode || kycData.postalCode,
        country: kycData.country || 'IN',
        phone: kycData.mobile || kycData.phone,
        email: kycData.email,
        document_type: 'aadhaar',
        status: 'approved', // Auto-approve for demo
        submitted_at: new Date().toISOString(),
        review_date: new Date().toISOString(),
        reviewer_notes: `Verified via ${verificationMethod}`
      };

      if (existingKyc) {
        await supabase
          .from('kyc')
          .update(kycRecord)
          .eq('id', existingKyc.id);
      } else {
        await supabase
          .from('kyc')
          .insert(kycRecord);
      }

      console.log('KYC data saved to Supabase successfully');
    } catch (error) {
      console.error('Failed to save KYC data to Supabase:', error);
    }
  }

  // Get KYC Status
  async getKYCStatus(userId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: kycData } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        success: true,
        status: kycData?.status || 'not_started',
        data: kycData
      };
    } catch (error) {
      console.error('Failed to get KYC status:', error);
      return {
        success: false,
        status: 'not_started',
        message: error instanceof Error ? error.message : 'Failed to get KYC status'
      };
    }
  }
}

export const kycApiService = new KYCApiService();
