import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Users, Database, Wifi, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  apiResponseTime: number;
  errorRate: number;
  userLoad: number;
  networkLatency: number;
  cacheHitRate: number;
}

interface PerformanceThresholds {
  memoryUsage: { good: number; warning: number };
  renderTime: { good: number; warning: number };
  apiResponseTime: { good: number; warning: number };
  errorRate: { good: number; warning: number };
  networkLatency: { good: number; warning: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  memoryUsage: { good: 50, warning: 80 }, // MB
  renderTime: { good: 16, warning: 33 }, // ms (60fps = 16ms, 30fps = 33ms)
  apiResponseTime: { good: 200, warning: 500 }, // ms
  errorRate: { good: 1, warning: 5 }, // percentage
  networkLatency: { good: 100, warning: 300 } // ms
};

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    bundleSize: 0,
    apiResponseTime: 0,
    errorRate: 0,
    userLoad: 1,
    networkLatency: 0,
    cacheHitRate: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [simulatedUserLoad, setSimulatedUserLoad] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderStartTime = useRef<number>(0);

  // Measure memory usage
  const measureMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }, []);

  // Measure render performance
  const measureRenderTime = useCallback((): number => {
    const now = performance.now();
    if (renderStartTime.current > 0) {
      return now - renderStartTime.current;
    }
    return 0;
  }, []);

  // Simulate API response time
  const measureAPIResponseTime = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      // Simulate API call with fetch to a fast endpoint
      await fetch('data:text/plain,test', { method: 'HEAD' });
      return performance.now() - start;
    } catch {
      return 999; // High value for failed requests
    }
  }, []);

  // Measure network latency
  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      const response = await fetch('https://httpbin.org/get', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return performance.now() - start;
    } catch {
      return 999; // High value for failed requests
    }
  }, []);

  // Calculate bundle size
  const calculateBundleSize = useCallback((): number => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('assets')) {
        // Estimate based on typical bundle sizes
        totalSize += 1000; // 1MB estimate per bundle
      }
    });
    
    return totalSize;
  }, []);

  // Simulate user load impact
  const simulateUserLoad = useCallback((userCount: number): PerformanceMetrics => {
    const baseMetrics = {
      memoryUsage: measureMemoryUsage(),
      renderTime: measureRenderTime(),
      bundleSize: calculateBundleSize(),
      apiResponseTime: 0,
      errorRate: 0,
      userLoad: userCount,
      networkLatency: 0,
      cacheHitRate: Math.max(0, 100 - (userCount / 1000) * 10) // Cache hit rate decreases with load
    };

    // Simulate performance degradation with user load
    const loadMultiplier = Math.log10(userCount + 1);
    
    return {
      ...baseMetrics,
      memoryUsage: baseMetrics.memoryUsage * (1 + loadMultiplier * 0.1),
      renderTime: baseMetrics.renderTime * (1 + loadMultiplier * 0.2),
      apiResponseTime: 100 + (userCount / 100) * 50, // Increases with user count
      errorRate: Math.min(10, (userCount / 10000) * 100), // Error rate increases with load
      networkLatency: 50 + (userCount / 1000) * 20 // Network latency increases with load
    };
  }, [measureMemoryUsage, measureRenderTime, calculateBundleSize]);

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    intervalRef.current = setInterval(async () => {
      renderStartTime.current = performance.now();
      
      const apiTime = await measureAPIResponseTime();
      const networkTime = await measureNetworkLatency();
      
      const newMetrics = simulateUserLoad(simulatedUserLoad);
      newMetrics.apiResponseTime = apiTime;
      newMetrics.networkLatency = networkTime;
      
      setMetrics(newMetrics);
    }, 2000); // Update every 2 seconds
  }, [simulatedUserLoad, measureAPIResponseTime, measureNetworkLatency, simulateUserLoad]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Get performance status
  const getPerformanceStatus = useCallback((value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'critical' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  }, []);

  // Calculate overall performance score
  const calculatePerformanceScore = useCallback((): number => {
    const scores = [
      getPerformanceStatus(metrics.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage) === 'good' ? 100 : 
      getPerformanceStatus(metrics.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage) === 'warning' ? 70 : 30,
      
      getPerformanceStatus(metrics.renderTime, PERFORMANCE_THRESHOLDS.renderTime) === 'good' ? 100 : 
      getPerformanceStatus(metrics.renderTime, PERFORMANCE_THRESHOLDS.renderTime) === 'warning' ? 70 : 30,
      
      getPerformanceStatus(metrics.apiResponseTime, PERFORMANCE_THRESHOLDS.apiResponseTime) === 'good' ? 100 : 
      getPerformanceStatus(metrics.apiResponseTime, PERFORMANCE_THRESHOLDS.apiResponseTime) === 'warning' ? 70 : 30,
      
      getPerformanceStatus(metrics.errorRate, PERFORMANCE_THRESHOLDS.errorRate) === 'good' ? 100 : 
      getPerformanceStatus(metrics.errorRate, PERFORMANCE_THRESHOLDS.errorRate) === 'warning' ? 70 : 30,
      
      getPerformanceStatus(metrics.networkLatency, PERFORMANCE_THRESHOLDS.networkLatency) === 'good' ? 100 : 
      getPerformanceStatus(metrics.networkLatency, PERFORMANCE_THRESHOLDS.networkLatency) === 'warning' ? 70 : 30
    ];
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [metrics, getPerformanceStatus]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const performanceScore = calculatePerformanceScore();

  return (
    <Card className="bg-[#1a1a1a] border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#B1420A]" />
            <span>Performance Monitor</span>
            <Badge 
              variant="outline" 
              className={`${
                performanceScore >= 80 ? 'border-green-500 text-green-400' :
                performanceScore >= 60 ? 'border-yellow-500 text-yellow-400' :
                'border-red-500 text-red-400'
              }`}
            >
              Score: {performanceScore}/100
            </Badge>
          </div>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            size="sm"
            className={isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-[#B1420A] hover:bg-[#8B3308]'}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* User Load Simulation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Simulated User Load</span>
            </div>
            <span className="text-sm text-gray-400">{simulatedUserLoad.toLocaleString()} users</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 1000, 10000, 50000].map((userCount) => (
              <Button
                key={userCount}
                onClick={() => setSimulatedUserLoad(userCount)}
                variant={simulatedUserLoad === userCount ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  simulatedUserLoad === userCount 
                    ? 'bg-[#B1420A] hover:bg-[#8B3308]' 
                    : 'border-gray-600 hover:bg-gray-700'
                }`}
              >
                {userCount === 1 ? '1' : `${userCount / 1000}K`}
              </Button>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Memory Usage</span>
              <span className="text-sm font-mono">{metrics.memoryUsage.toFixed(1)} MB</span>
            </div>
            <Progress 
              value={Math.min(100, (metrics.memoryUsage / 100) * 100)} 
              className="h-2"
            />
          </div>

          {/* Render Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Render Time</span>
              <span className="text-sm font-mono">{metrics.renderTime.toFixed(1)} ms</span>
            </div>
            <Progress 
              value={Math.min(100, (metrics.renderTime / 50) * 100)} 
              className="h-2"
            />
          </div>

          {/* API Response Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">API Response</span>
              <span className="text-sm font-mono">{metrics.apiResponseTime.toFixed(0)} ms</span>
            </div>
            <Progress 
              value={Math.min(100, (metrics.apiResponseTime / 1000) * 100)} 
              className="h-2"
            />
          </div>

          {/* Error Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Error Rate</span>
              <span className="text-sm font-mono">{metrics.errorRate.toFixed(2)}%</span>
            </div>
            <Progress 
              value={Math.min(100, metrics.errorRate * 10)} 
              className="h-2"
            />
          </div>

          {/* Network Latency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Network Latency</span>
              <span className="text-sm font-mono">{metrics.networkLatency.toFixed(0)} ms</span>
            </div>
            <Progress 
              value={Math.min(100, (metrics.networkLatency / 500) * 100)} 
              className="h-2"
            />
          </div>

          {/* Cache Hit Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Cache Hit Rate</span>
              <span className="text-sm font-mono">{metrics.cacheHitRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metrics.cacheHitRate} 
              className="h-2"
            />
          </div>
        </div>

        {/* Performance Recommendations */}
        {performanceScore < 80 && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-400 mb-2">Performance Recommendations</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  {metrics.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage.warning && (
                    <li>• Optimize memory usage - consider implementing virtual scrolling</li>
                  )}
                  {metrics.renderTime > PERFORMANCE_THRESHOLDS.renderTime.warning && (
                    <li>• Improve render performance - use React.memo and useMemo</li>
                  )}
                  {metrics.apiResponseTime > PERFORMANCE_THRESHOLDS.apiResponseTime.warning && (
                    <li>• Optimize API calls - implement caching and request batching</li>
                  )}
                  {metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRate.warning && (
                    <li>• Reduce error rate - implement better error handling</li>
                  )}
                  {simulatedUserLoad > 10000 && (
                    <li>• Consider implementing CDN and load balancing for high user loads</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Scale Status */}
        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#B1420A]" />
            <span className="text-sm font-medium">Enterprise Scale Ready</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${
              simulatedUserLoad >= 50000 && performanceScore >= 70 ? 'border-green-500 text-green-400' :
              simulatedUserLoad >= 10000 && performanceScore >= 60 ? 'border-yellow-500 text-yellow-400' :
              'border-red-500 text-red-400'
            }`}
          >
            {simulatedUserLoad >= 50000 && performanceScore >= 70 ? 'Ready' :
             simulatedUserLoad >= 10000 && performanceScore >= 60 ? 'Partial' : 'Not Ready'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
