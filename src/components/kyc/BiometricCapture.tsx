import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Loader2, 
  Fingerprint, 
  Eye, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Shield,
  Scan
} from 'lucide-react';

interface BiometricCaptureProps {
  biometricType: 'fingerprint' | 'iris' | 'face';
  onCapture: (biometricData: string) => void;
  onRetry: () => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
  quality?: number;
  className?: string;
}

export const BiometricCapture: React.FC<BiometricCaptureProps> = ({
  biometricType,
  onCapture,
  onRetry,
  loading = false,
  error,
  success = false,
  quality = 0,
  className = ''
}) => {
  const [captureState, setCaptureState] = useState<'idle' | 'capturing' | 'processing' | 'complete'>('idle');
  const [captureProgress, setCaptureProgress] = useState(0);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Biometric type configurations
  const biometricConfig = {
    fingerprint: {
      icon: Fingerprint,
      title: 'Fingerprint Capture',
      description: 'Place your finger on the scanner',
      minQuality: 60,
      timeout: 10000,
      instructions: [
        'Clean your finger with a dry cloth',
        'Place finger firmly on the scanner',
        'Keep finger steady during capture',
        'Do not press too hard or too light'
      ]
    },
    iris: {
      icon: Eye,
      title: 'Iris Scan',
      description: 'Look directly into the scanner',
      minQuality: 70,
      timeout: 15000,
      instructions: [
        'Remove glasses if wearing any',
        'Look directly at the scanner',
        'Keep eyes open and steady',
        'Maintain 6-8 inches distance'
      ]
    },
    face: {
      icon: Camera,
      title: 'Face Recognition',
      description: 'Position your face in the frame',
      minQuality: 65,
      timeout: 8000,
      instructions: [
        'Ensure good lighting',
        'Look directly at the camera',
        'Keep face within the frame',
        'Remove any face coverings'
      ]
    }
  };

  const config = biometricConfig[biometricType];
  const IconComponent = config.icon;

  useEffect(() => {
    setInstructions(config.instructions);
  }, [biometricType]);

  // Simulate biometric capture process
  const startCapture = async () => {
    setCaptureState('capturing');
    setCaptureProgress(0);
    setCurrentStep(0);

    // Simulate capture progress
    const progressInterval = setInterval(() => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setCaptureState('processing');
          return 100;
        }
        return prev + 10;
      });
    }, config.timeout / 10);

    // Simulate processing after capture
    setTimeout(() => {
      if (captureState !== 'idle') {
        setCaptureState('complete');
        // Generate mock biometric data
        const mockBiometricData = `${biometricType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onCapture(mockBiometricData);
      }
    }, config.timeout + 1000);
  };

  const handleRetry = () => {
    setCaptureState('idle');
    setCaptureProgress(0);
    setCurrentStep(0);
    onRetry();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    if (quality >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <IconComponent className="h-8 w-8 text-blue-600 mr-2" />
          <CardTitle className="text-xl font-semibold" style={{ color: '#B1420A' }}>
            {config.title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          {config.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capture Area */}
        <div className="relative">
          <div className={`
            w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center
            ${captureState === 'capturing' ? 'border-blue-500 bg-blue-50' : 
              captureState === 'complete' ? 'border-green-500 bg-green-50' : 
              error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}
          `}>
            {captureState === 'idle' && (
              <div className="text-center">
                <IconComponent className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Ready to capture</p>
              </div>
            )}

            {captureState === 'capturing' && (
              <div className="text-center">
                <Scan className="h-16 w-16 text-blue-600 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-blue-600">Capturing...</p>
              </div>
            )}

            {captureState === 'processing' && (
              <div className="text-center">
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-blue-600">Processing...</p>
              </div>
            )}

            {captureState === 'complete' && (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600">Capture successful</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(captureState === 'capturing' || captureState === 'processing') && (
            <div className="mt-2">
              <Progress value={captureProgress} className="w-full" />
              <p className="text-xs text-center text-gray-600 mt-1">
                {captureProgress}% complete
              </p>
            </div>
          )}
        </div>

        {/* Quality Indicator */}
        {quality > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Capture Quality:</span>
            <div className="flex items-center">
              <Badge variant="outline" className={getQualityColor(quality)}>
                {quality}% - {getQualityLabel(quality)}
              </Badge>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Instructions:</h4>
          <ul className="space-y-1">
            {instructions.map((instruction, index) => (
              <li 
                key={index}
                className={`text-xs flex items-center ${
                  index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Biometric capture successful! Quality: {quality}%
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
          {captureState === 'idle' && (
            <Button
              onClick={startCapture}
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: '#B1420A' }}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              Start {config.title}
            </Button>
          )}

          {(captureState === 'capturing' || captureState === 'processing') && (
            <Button
              variant="outline"
              onClick={() => setCaptureState('idle')}
              className="w-full"
            >
              Cancel Capture
            </Button>
          )}

          {(captureState === 'complete' || error) && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Capture
            </Button>
          )}
        </div>

        {/* Technical Information */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Security Information</p>
              <ul className="space-y-1">
                <li>• Minimum quality required: {config.minQuality}%</li>
                <li>• Capture timeout: {config.timeout / 1000} seconds</li>
                <li>• Data encrypted during transmission</li>
                <li>• Compliant with UIDAI standards</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Device Requirements */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Ensure your device has the required {biometricType} sensor.
            <br />
            Contact support if you experience technical issues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
