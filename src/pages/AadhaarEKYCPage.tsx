import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKYC } from '@/contexts/KYCContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';

// Import our new Aadhaar eKYC components
import { AadhaarNumberInput } from '@/components/kyc/AadhaarNumberInput';
import { AadhaarOTPVerification } from '@/components/kyc/AadhaarOTPVerification';
import { BiometricCapture } from '@/components/kyc/BiometricCapture';
import { AadhaarQRScanner } from '@/components/kyc/AadhaarQRScanner';
import { AadhaarEKYCFlow } from '@/components/kyc/AadhaarEKYCFlow';

// Import the API service
import { kycApiService } from '@/services/kycApiService';

const AadhaarEKYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { kycStatus, setKycStatus } = useKYC();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle KYC completion
  const handleKYCComplete = useCallback(async (kycData: unknown) => {
    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('KYC completed with data:', kycData);

      // Perform AML risk assessment
      const amlResult = await kycApiService.performAMLRiskAssessment(user.id, {
        country: 'IN',
        name: kycData.name,
        address: kycData.address
      });

      console.log('AML risk assessment result:', amlResult);

      // Update KYC status in context
      if (typeof setKycStatus === 'function') {
        setKycStatus('approved');
      }

      setSuccess(true);

      toast({
        title: "KYC Verification Complete!",
        description: `Your identity has been verified successfully. Risk Level: ${amlResult.riskLevel}`,
      });

      // Navigate to success page or dashboard after a delay
      setTimeout(() => {
        navigate('/kyc', { 
          state: { 
            kycCompleted: true, 
            kycData,
            amlResult 
          } 
        });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'KYC completion failed';
      setError(errorMessage);
      
      toast({
        title: "KYC Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, setKycStatus, toast, navigate]);

  // Handle KYC cancellation
  const handleKYCCancel = useCallback(() => {
    navigate('/kyc');
  }, [navigate]);

  // Check if user already has approved KYC
  if (kycStatus === 'approved') {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/kyc')}
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Aadhaar eKYC</h1>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Already Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Your KYC verification is already complete.
            </p>
            <Button 
              onClick={() => navigate('/kyc')}
              style={{ backgroundColor: '#B1420A' }}
            >
              Go to KYC Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/kyc')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Aadhaar eKYC Verification</h1>
      </div>

      {/* Success State */}
      {success && (
        <Card className="max-w-md mx-auto mb-6">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Verification Complete!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting to KYC dashboard...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert className="max-w-md mx-auto mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main eKYC Flow */}
      {!success && (
        <AadhaarEKYCFlow
          onComplete={handleKYCComplete}
          onCancel={handleKYCCancel}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Information Card */}
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-600" />
            About Aadhaar eKYC
          </CardTitle>
          <CardDescription>
            Secure and instant identity verification using your Aadhaar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Secure</h4>
              <p className="text-blue-600">
                UIDAI compliant encryption and data protection
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Instant</h4>
              <p className="text-green-600">
                Complete verification in under 5 minutes
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Compliant</h4>
              <p className="text-purple-600">
                Meets RBI and SEBI KYC requirements
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Verification Methods:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>OTP Verification:</strong> SMS OTP to registered mobile</li>
              <li>• <strong>Biometric:</strong> Fingerprint or iris scan</li>
              <li>• <strong>QR Code:</strong> Scan from Aadhaar card or e-Aadhaar</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AadhaarEKYCPage;
