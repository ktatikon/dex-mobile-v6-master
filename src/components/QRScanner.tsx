import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (result: string) => void;
  disabled?: boolean;
  className?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  disabled = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if device supports camera
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    checkCameraSupport();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraSupport = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === 'videoinput');
      setHasCamera(hasVideoInput && !!navigator.mediaDevices.getUserMedia);
    } catch (error) {
      console.error('Error checking camera support:', error);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start QR code detection
      startQRDetection();
    } catch (error) {
      console.error('Error starting camera:', error);
      setError('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    // For now, we'll use a simple file input fallback
    // In a real implementation, you'd use a QR code detection library like jsQR
    console.log('QR detection started - using fallback method');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For demo purposes, we'll simulate QR code detection
    // In a real implementation, you'd process the image with a QR library
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Simulate finding an address in the QR code
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      handleQRResult(mockAddress);
    };
    reader.readAsDataURL(file);
  };

  const handleQRResult = (result: string) => {
    // Validate if result looks like an address
    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (addressPattern.test(result)) {
      onScan(result);
      setIsOpen(false);
      stopCamera();
      toast({
        title: "QR Code Scanned",
        description: "Address successfully scanned from QR code",
        variant: "default",
      });
    } else {
      setError('QR code does not contain a valid address');
    }
  };

  const handleManualInput = () => {
    // For demo purposes, provide a sample address
    const sampleAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
    handleQRResult(sampleAddress);
  };

  if (!hasCamera) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={`h-10 w-10 p-0 ${className}`}
          >
            <QrCode size={16} />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#1a1a1a] border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">QR Code Scanner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Camera not available. You can upload a QR code image instead.
            </p>
            
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-upload"
                />
                <Button
                  onClick={() => document.getElementById('qr-upload')?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Upload QR Code Image
                </Button>
              </label>
              
              <Button
                onClick={handleManualInput}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Use Sample Address (Demo)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`h-10 w-10 p-0 ${className}`}
        >
          <QrCode size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-gray-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            QR Code Scanner
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {!isScanning ? (
            <div className="space-y-3">
              <Button
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Camera size={16} />
                <span>Start Camera</span>
              </Button>
              
              <div className="text-center text-gray-400 text-sm">or</div>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-upload-camera"
                />
                <Button
                  onClick={() => document.getElementById('qr-upload-camera')?.click()}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Upload QR Code Image
                </Button>
              </label>
              
              <Button
                onClick={handleManualInput}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Use Sample Address (Demo)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm text-center">
                Point your camera at a QR code containing an address
              </p>
              
              <Button
                onClick={stopCamera}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Stop Camera
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
