import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface AadhaarNumberInputProps {
  onSubmit: (aadhaarNumber: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const AadhaarNumberInput: React.FC<AadhaarNumberInputProps> = ({
  onSubmit,
  loading = false,
  error,
  className = ''
}) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [formattedNumber, setFormattedNumber] = useState('');

  // Aadhaar validation regex (12 digits, not starting with 0 or 1)
  const aadhaarRegex = /^[2-9][0-9]{11}$/;

  // Format Aadhaar number with spaces (XXXX XXXX XXXX)
  const formatAadhaarNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    return formatted;
  };

  // Validate Aadhaar number using Verhoeff algorithm
  const validateAadhaarChecksum = (aadhaar: string) => {
    // Verhoeff algorithm implementation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let c = 0;const myArray = aadhaar.split('').map(Number).reverse();

    for (let i = 0;i < myArray.length; i++) {
      c = d[c][p[((i + 1) % 8)][myArray[i]]];
    }

    return c === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length <= 12) {
      setAadhaarNumber(value);
      setFormattedNumber(formatAadhaarNumber(value));
      
      if (value.length === 12) {
        setShowValidation(true);
        const basicValid = aadhaarRegex.test(value);
        const checksumValid = validateAadhaarChecksum(value);
        setIsValid(basicValid && checksumValid);
      } else {
        setShowValidation(false);
        setIsValid(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onSubmit(aadhaarNumber);
    }
  };

  const getValidationMessage = () => {
    if (!showValidation) return null;
    
    if (isValid) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Valid Aadhaar number format
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Invalid Aadhaar number. Please check the format and try again.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-8 w-8 text-blue-600 mr-2" />
          <CardTitle className="text-xl font-semibold" style={{ color: '#B1420A' }}>
            Aadhaar eKYC
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Enter your 12-digit Aadhaar number for secure verification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="aadhaar" className="text-sm font-medium text-gray-700">
              Aadhaar Number
            </label>
            <Input
              id="aadhaar"
              type="text"
              placeholder="XXXX XXXX XXXX"
              value={formattedNumber}
              onChange={handleInputChange}
              className={`text-center text-lg tracking-wider ${
                showValidation 
                  ? isValid 
                    ? 'border-green-500 focus:border-green-500' 
                    : 'border-red-500 focus:border-red-500'
                  : 'border-gray-300'
              }`}
              maxLength={14} // Including spaces
              disabled={loading}
              autoComplete="off"
              style={{ fontFamily: 'monospace' }}
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{aadhaarNumber.length}/12 digits</span>
              {showValidation && (
                <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
                  {isValid ? "Valid" : "Invalid"}
                </Badge>
              )}
            </div>
          </div>

          {getValidationMessage()}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || loading}
            style={{ backgroundColor: '#B1420A' }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Proceed to OTP Verification'
            )}
          </Button>
        </form>

        {/* Security Information */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Security & Privacy</p>
              <ul className="space-y-1 text-xs">
                <li>• Your Aadhaar data is encrypted and secure</li>
                <li>• We comply with UIDAI guidelines</li>
                <li>• No Aadhaar data is stored permanently</li>
                <li>• Used only for KYC verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't have your Aadhaar card?{' '}
            <button 
              type="button" 
              className="text-blue-600 hover:underline"
              onClick={() => window.open('https://uidai.gov.in/', '_blank')}
            >
              Download from UIDAI
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
