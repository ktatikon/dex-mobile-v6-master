import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error tracking service
    // like Sentry, LogRocket, or Bugsnag
    console.log('Logging error to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentName: this.props.componentName
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const error = this.state.error;
    const errorInfo = this.state.errorInfo;
    
    const bugReport = {
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentName: this.props.componentName || 'Unknown component'
    };

    // In a real app, you'd open a bug report form or send to support
    console.log('Bug report:', bugReport);
    
    // For demo, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
      .then(() => alert('Bug report copied to clipboard'))
      .catch(() => alert('Failed to copy bug report'));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const error = this.state.error;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[#1a1a1a] border-red-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <CardTitle className="text-white">
                Something went wrong
              </CardTitle>
              <p className="text-gray-400 text-sm">
                {this.props.componentName ? 
                  `An error occurred in ${this.props.componentName}` :
                  'An unexpected error occurred'
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-3 bg-red-900/10 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm font-mono">
                  {error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="text-center text-gray-400 text-sm">
                  Retry attempts: {this.state.retryCount}/{this.maxRetries}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Component
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {/* Debug Information (Development only) */}
              {this.props.showDetails && process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-gray-400 text-sm hover:text-white">
                    Show Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                    <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                      {error?.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-gray-400 overflow-auto max-h-40 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Report Bug Button */}
              <Button
                onClick={this.handleReportBug}
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-white"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Bug
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting
export const useErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  };

  return { reportError };
};

export default EnhancedErrorBoundary;
