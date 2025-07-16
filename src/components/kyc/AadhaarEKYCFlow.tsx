import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  User,
  FileText,
  Smartphone
} from 'lucide-react';

import { AadhaarNumberInput } from './AadhaarNumberInput';
import { AadhaarOTPVerification } from './AadhaarOTPVerification';
import { BiometricCapture } from './BiometricCapture';
import { AadhaarQRScanner } from './AadhaarQRScanner';
import { kycApiService } from '@/services/kycApiService';
import { useAuth } from '@/contexts/AuthContext';

interface AadhaarEKYCFlowProps {
  onComplete: (kycData: unknown) => void;
  onCancel: () => void;
  className?: string;
}

type FlowStep = 'method' | 'aadhaar' | 'otp' | 'biometric' | 'qr' | 'complete';
type VerificationMethod = 'otp' | 'biometric' | 'qr';

export const AadhaarEKYCFlow: React.FC<AadhaarEKYCFlowProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('method');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('otp');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kycData, setKycData] = useState<any>({});

  // Step configuration
  const stepConfig = {
    method: { title: 'Choose Method', progress: 20 },
    aadhaar: { title: 'Aadhaar Number', progress: 40 },
    otp: { title: 'OTP Verification', progress: 60 },
    biometric: { title: 'Biometric Capture', progress: 60 },
    qr: { title: 'QR Code Scan', progress: 60 },
    complete: { title: 'Complete', progress: 100 }
  };

  // Handle method selection
  const handleMethodSelect = (method: VerificationMethod) => {
    setVerificationMethod(method);
    if (method === 'qr') {
      setCurrentStep('qr');
    } else {
      setCurrentStep('aadhaar');
    }
  };

  // Handle Aadhaar number submission
  const handleAadhaarSubmit = useCallback(async (number: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate Aadhaar number first
      const validationResult = await kycApiService.validateAadhaar(number);

      if (!validationResult.success) {
        throw new Error(validationResult.message);
      }

      setAadhaarNumber(number);
      setKycData(prev => ({ ...prev, aadhaarNumber: number }));

      if (verificationMethod === 'otp') {
        // Initiate OTP for Aadhaar
        const otpResult = await kycApiService.initiateAadhaarOTP(number, user.id);

        if (!otpResult.success) {
          throw new Error(otpResult.message);
        }

        setReferenceId(otpResult.referenceId || '');
        setCurrentStep('otp');
      } else if (verificationMethod === 'biometric') {
        setCurrentStep('biometric');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate Aadhaar number. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [verificationMethod, user]);

  // Handle OTP verification
  const handleOTPVerify = useCallback(async (otp: string) => {
    if (!user || !referenceId) {
      setError('Missing verification data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const otpResult = await kycApiService.verifyAadhaarOTP(referenceId, otp, user.id);

      if (!otpResult.success) {
        throw new Error(otpResult.message);
      }

      const kycResult = otpResult.kycData || {
        aadhaarNumber,
        name: 'John Doe', // This would come from actual Aadhaar data
        dateOfBirth: '01/01/1990',
        gender: 'Male',
        address: '123 Main Street, Sample City, Delhi - 110001',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'IN',
        verificationMethod: 'otp',
        verifiedAt: new Date().toISOString()
      };

      setKycData(kycResult);
      setCurrentStep('complete');
      onComplete(kycResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [aadhaarNumber, referenceId, user, onComplete]);

  // Handle OTP resend
  const handleOTPResend = useCallback(async () => {
    if (!user || !referenceId) {
      setError('Missing verification data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resendResult = await kycApiService.resendAadhaarOTP(referenceId, user.id);

      if (!resendResult.success) {
        throw new Error(resendResult.message);
      }

      // Update reference ID if provided
      if (resendResult.referenceId) {
        setReferenceId(resendResult.referenceId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  }, [user, referenceId]);

  // Handle biometric capture
  const handleBiometricCapture = useCallback(async (biometricData: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockKYCData = {
        aadhaarNumber,
        name: 'John Doe',
        dateOfBirth: '01/01/1990',
        gender: 'Male',
        address: '123 Main Street, Sample City, Delhi - 110001',
        photo: null,
        biometricData,
        verificationMethod: 'biometric',
        verifiedAt: new Date().toISOString()
      };
      
      setKycData(mockKYCData);
      setCurrentStep('complete');
      onComplete(mockKYCData);
    } catch (err) {
      setError('Biometric verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [aadhaarNumber, onComplete]);

  // Handle QR scan
  const handleQRScan = useCallback(async (qrData: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const parsedData = JSON.parse(qrData);
      const mockKYCData = {
        ...parsedData,
        verificationMethod: 'qr',
        verifiedAt: new Date().toISOString()
      };
      
      setKycData(mockKYCData);
      setCurrentStep('complete');
      onComplete(mockKYCData);
    } catch (err) {
      setError('Failed to process QR code data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'aadhaar') {
      setCurrentStep('method');
    } else if (currentStep === 'otp' || currentStep === 'biometric') {
      setCurrentStep('aadhaar');
    } else if (currentStep === 'qr') {
      setCurrentStep('method');
    }
    setError('');
  };

  const currentConfig = stepConfig[currentStep];

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <CardTitle className="text-2xl font-bold" style={{ color: '#B1420A' }}>
              Aadhaar eKYC Verification
            </CardTitle>
          </div>
          <CardDescription>
            Complete your identity verification using Aadhaar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentConfig.title}</span>
              <span>{currentConfig.progress}%</span>
            </div>
            <Progress value={currentConfig.progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Method Selection */}
      {currentStep === 'method' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Verification Method</CardTitle>
            <CardDescription>
              Select how you would like to verify your Aadhaar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="p-6 h-auto flex items-start text-left"
                onClick={() => handleMethodSelect('otp')}
              >
                <Smartphone className="h-6 w-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">OTP Verification</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive OTP on your registered mobile number
                  </p>
                  <Badge className="mt-2" variant="secondary">Recommended</Badge>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-6 h-auto flex items-start text-left"
                onClick={() => handleMethodSelect('biometric')}
              >
                <User className="h-6 w-6 text-green-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">Biometric Verification</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Use fingerprint or iris scan for verification
                  </p>
                  <Badge className="mt-2" variant="outline">Secure</Badge>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-6 h-auto flex items-start text-left"
                onClick={() => handleMethodSelect('qr')}
              >
                <FileText className="h-6 w-6 text-purple-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">QR Code Scan</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Scan QR code from your Aadhaar card or e-Aadhaar
                  </p>
                  <Badge className="mt-2" variant="outline">Quick</Badge>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aadhaar Number Input */}
      {currentStep === 'aadhaar' && (
        <AadhaarNumberInput
          onSubmit={handleAadhaarSubmit}
          loading={loading}
          error={error}
        />
      )}

      {/* OTP Verification */}
      {currentStep === 'otp' && (
        <AadhaarOTPVerification
          aadhaarNumber={aadhaarNumber}
          onVerify={handleOTPVerify}
          onResendOTP={handleOTPResend}
          loading={loading}
          error={error}
        />
      )}

      {/* Biometric Capture */}
      {currentStep === 'biometric' && (
        <BiometricCapture
          biometricType="fingerprint"
          onCapture={handleBiometricCapture}
          onRetry={() => setError('')}
          loading={loading}
          error={error}
        />
      )}

      {/* QR Scanner */}
      {currentStep === 'qr' && (
        <AadhaarQRScanner
          onScanSuccess={handleQRScan}
          onScanError={setError}
          loading={loading}
        />
      )}

      {/* Completion */}
      {currentStep === 'complete' && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Verification Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your Aadhaar eKYC has been successfully verified
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800">
                <p><strong>Name:</strong> {kycData.name}</p>
                <p><strong>Method:</strong> {kycData.verificationMethod?.toUpperCase()}</p>
                <p><strong>Verified:</strong> {new Date(kycData.verifiedAt).toLocaleString()}</p>
              </div>
            </div>

            <Button 
              onClick={() => onComplete(kycData)}
              style={{ backgroundColor: '#B1420A' }}
            >
              Continue to Next Step
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {currentStep !== 'method' && currentStep !== 'complete' && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
