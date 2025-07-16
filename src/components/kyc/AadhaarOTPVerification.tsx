import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface AadhaarOTPVerificationProps {
  aadhaarNumber: string;
  onVerify: (otp: string) => void;
  onResendOTP: () => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
}

export const AadhaarOTPVerification: React.FC<AadhaarOTPVerificationProps> = ({
  aadhaarNumber,
  onVerify,
  onResendOTP,
  loading = false,
  error,
  success = false,
  className = ''
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format Aadhaar number for display
  const formatAadhaarForDisplay = (number: string) => {
    return number.replace(/(\d{4})(\d{4})(\d{4})/, 'XXXX XXXX $3');
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !success) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, success]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      onVerify(pastedData);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await onResendOTP();
      setTimeLeft(300); // Reset timer
      setCanResend(false);
      setOtp(['', '', '', '', '', '']); // Clear OTP
      inputRefs.current[0]?.focus();
    } finally {
      setResendLoading(false);
    }
  };

  // Clear OTP
  const clearOTP = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isOTPComplete = otp.every(digit => digit !== '');
  const otpValue = otp.join('');

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-8 w-8 text-green-600 mr-2" />
          <CardTitle className="text-xl font-semibold" style={{ color: '#B1420A' }}>
            OTP Verification
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Enter the 6-digit OTP sent to your registered mobile number
        </CardDescription>
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {formatAadhaarForDisplay(aadhaarNumber)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OTP Input Fields */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Enter OTP
          </label>
          <div 
            className="flex justify-center space-x-2"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOTPChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  success 
                    ? 'border-green-500 bg-green-50' 
                    : error && isOTPComplete
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                disabled={loading || success}
                autoComplete="off"
                style={{ fontFamily: 'monospace' }}
              />
            ))}
          </div>
        </div>

        {/* Timer and Resend */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP Expired'}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendOTP}
            disabled={!canResend || resendLoading || loading}
            className="text-blue-600 hover:text-blue-800"
          >
            {resendLoading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-1 h-3 w-3" />
                Resend OTP
              </>
            )}
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              OTP verified successfully! Proceeding with eKYC...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => onVerify(otpValue)}
            className="w-full"
            disabled={!isOTPComplete || loading || success}
            style={{ backgroundColor: '#B1420A' }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying OTP...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verified
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

          {!success && (
            <Button
              variant="outline"
              onClick={clearOTP}
              className="w-full"
              disabled={loading}
            >
              Clear OTP
            </Button>
          )}
        </div>

        {/* Help Information */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-2">Didn't receive OTP?</p>
            <ul className="space-y-1">
              <li>• Check your registered mobile number</li>
              <li>• Wait for up to 2 minutes for SMS delivery</li>
              <li>• Ensure good network connectivity</li>
              <li>• Try resending after timer expires</li>
            </ul>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500">
          <p>
            This OTP is valid for 5 minutes and can only be used once.
            <br />
            Never share your OTP with anyone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
