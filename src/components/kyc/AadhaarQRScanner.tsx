import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  QrCode, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  FileImage,
  Scan,
  Shield,
  Info
} from 'lucide-react';

interface AadhaarQRScannerProps {
  onScanSuccess: (qrData: string) => void;
  onScanError: (error: string) => void;
  loading?: boolean;
  className?: string;
}

interface QRData {
  name: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  photo?: string;
}

export const AadhaarQRScanner: React.FC<AadhaarQRScannerProps> = ({
  onScanSuccess,
  onScanError,
  loading = false,
  className = ''
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock QR code data for demonstration
  const mockQRData: QRData = {
    name: 'John Doe',
    aadhaarNumber: '123456789012',
    dateOfBirth: '01/01/1990',
    gender: 'M',
    address: '123 Main Street, Sample City',
    pincode: '110001',
    state: 'Delhi',
    district: 'New Delhi'
  };

  // Simulate QR code scanning
  const simulateQRScan = useCallback((source: 'camera' | 'file') => {
    setIsScanning(true);
    setError('');
    
    // Simulate processing delay
    setTimeout(() => {
      try {
        // In a real implementation, this would parse actual QR code data
        const qrDataString = JSON.stringify(mockQRData);
        setScannedData(mockQRData);
        setIsScanning(false);
        onScanSuccess(qrDataString);
      } catch (err) {
        const errorMessage = `Failed to scan QR code from ${source}`;
        setError(errorMessage);
        setIsScanning(false);
        onScanError(errorMessage);
      }
    }, 2000);
  }, [onScanSuccess, onScanError]);

  // Handle camera scan
  const handleCameraScan = () => {
    setScanMode('camera');
    simulateQRScan('camera');
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setScanMode('upload');
        simulateQRScan('file');
      } else {
        setError('Please select a valid image file');
        onScanError('Invalid file type');
      }
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScanMode(null);
    setIsScanning(false);
    setScannedData(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format Aadhaar number for display
  const formatAadhaarForDisplay = (number: string) => {
    return number.replace(/(\d{4})(\d{4})(\d{4})/, 'XXXX XXXX $3');
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <QrCode className="h-8 w-8 text-blue-600 mr-2" />
          <CardTitle className="text-xl font-semibold" style={{ color: '#B1420A' }}>
            Aadhaar QR Scanner
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Scan QR code from your Aadhaar card or e-Aadhaar
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!scanMode && !scannedData && (
          <>
            {/* Scan Options */}
            <div className="space-y-3">
              <Button
                onClick={handleCameraScan}
                className="w-full flex items-center justify-center"
                disabled={loading}
                style={{ backgroundColor: '#B1420A' }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan with Camera
              </Button>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center"
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload QR Image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How to scan:</p>
                  <ul className="space-y-1">
                    <li>• Use camera to scan QR code directly</li>
                    <li>• Or upload a clear image of the QR code</li>
                    <li>• Ensure good lighting and focus</li>
                    <li>• QR code should be clearly visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Scanning State */}
        {isScanning && (
          <div className="text-center py-8">
            <div className="relative">
              <div className="w-32 h-32 border-2 border-dashed border-blue-500 rounded-lg mx-auto flex items-center justify-center bg-blue-50">
                <Scan className="h-16 w-16 text-blue-600 animate-pulse" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-blue-600 font-medium">
                  {scanMode === 'camera' ? 'Scanning QR code...' : 'Processing image...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please wait while we extract the data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scanned Data Display */}
        {scannedData && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                QR code scanned successfully!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Extracted Information:</h4>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{scannedData.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Aadhaar:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatAadhaarForDisplay(scannedData.aadhaarNumber)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">DOB:</span>
                  <span className="font-medium">{scannedData.dateOfBirth}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{scannedData.gender === 'M' ? 'Male' : 'Female'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span className="font-medium">{scannedData.state}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Pincode:</span>
                  <span className="font-medium">{scannedData.pincode}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Address:</span> {scannedData.address}
                </p>
              </div>
            </div>

            <Button
              onClick={resetScanner}
              variant="outline"
              className="w-full"
            >
              Scan Another QR Code
            </Button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>

            <Button
              onClick={resetScanner}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Security Information */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Security & Privacy</p>
              <ul className="space-y-1">
                <li>• QR data is processed locally</li>
                <li>• No images stored on servers</li>
                <li>• Encrypted data transmission</li>
                <li>• UIDAI compliant processing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble scanning?{' '}
            <button 
              type="button" 
              className="text-blue-600 hover:underline"
              onClick={() => {/* Handle help */}}
            >
              View troubleshooting guide
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
