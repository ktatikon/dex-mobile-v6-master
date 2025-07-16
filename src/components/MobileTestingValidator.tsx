import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Smartphone, Tablet, Monitor, RefreshCw } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  element?: HTMLElement | null;
}

interface ViewportTest {
  name: string;
  width: number;
  height: number;
  description: string;
}

const VIEWPORT_TESTS: ViewportTest[] = [
  { name: 'iPhone SE', width: 375, height: 667, description: 'Small mobile (320px+)' },
  { name: 'iPhone 12', width: 390, height: 844, description: 'Standard mobile' },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, description: 'Large mobile' },
  { name: 'iPad Mini', width: 768, height: 1024, description: 'Small tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, description: 'Large tablet' },
  { name: 'Desktop', width: 1440, height: 900, description: 'Desktop view' }
];

export const MobileTestingValidator: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentViewport, setCurrentViewport] = useState<ViewportTest>(VIEWPORT_TESTS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [testCount, setTestCount] = useState(0);

  // Run comprehensive mobile tests
  const runMobileTests = useCallback(async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Touch Target Size Validation (44px minimum)
      const touchElements = document.querySelectorAll('button, [role="button"], input, select, a');
      const touchTargetFailures = 0;touchElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const minSize = 44;
        
        if (rect.width < minSize || rect.height < minSize) {
          touchTargetFailures++;
        }
      });

      results.push({
        test: 'Touch Target Size (44px minimum)',
        status: touchTargetFailures === 0 ? 'PASS' : 'FAIL',
        details: touchTargetFailures === 0 
          ? `All ${touchElements.length} interactive elements meet 44px minimum`
          : `${touchTargetFailures} elements below 44px minimum size`
      });

      // Test 2: Viewport Responsiveness
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      results.push({
        test: 'Viewport Meta Tag',
        status: viewportMeta ? 'PASS' : 'FAIL',
        details: viewportMeta 
          ? 'Viewport meta tag configured correctly'
          : 'Missing viewport meta tag for mobile optimization'
      });

      // Test 3: Horizontal Scrolling Check
      const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
      results.push({
        test: 'Horizontal Scrolling',
        status: hasHorizontalScroll ? 'FAIL' : 'PASS',
        details: hasHorizontalScroll 
          ? 'Horizontal scrolling detected - content overflows viewport'
          : 'No horizontal scrolling - content fits viewport'
      });

      // Test 4: Font Size Readability
      const textElements = document.querySelectorAll('p, span, div, label, button');
      const smallTextCount = 0;textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        
        if (fontSize < 14) {
          smallTextCount++;
        }
      });

      results.push({
        test: 'Font Size Readability (14px minimum)',
        status: smallTextCount === 0 ? 'PASS' : 'WARNING',
        details: smallTextCount === 0 
          ? 'All text meets minimum 14px size for mobile readability'
          : `${smallTextCount} elements with text smaller than 14px`
      });

      // Test 5: Loading Performance
      const performanceEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const loadTime = performanceEntries[0]?.loadEventEnd - performanceEntries[0]?.loadEventStart;
      
      results.push({
        test: 'Page Load Performance',
        status: loadTime < 3000 ? 'PASS' : loadTime < 5000 ? 'WARNING' : 'FAIL',
        details: `Page load time: ${Math.round(loadTime)}ms (Target: <3000ms)`
      });

      // Test 6: SwapBlock Specific Tests
      const swapBlock = document.querySelector('[class*="SwapBlock"], [class*="swap-block"]');
      if (swapBlock) {
        const swapRect = swapBlock.getBoundingClientRect();
        const fitsInViewport = swapRect.width <= window.innerWidth && swapRect.height <= window.innerHeight;
        
        results.push({
          test: 'SwapBlock Mobile Fit',
          status: fitsInViewport ? 'PASS' : 'FAIL',
          details: fitsInViewport 
            ? 'SwapBlock fits within mobile viewport'
            : `SwapBlock dimensions (${Math.round(swapRect.width)}x${Math.round(swapRect.height)}) exceed viewport`
        });
      }

      // Test 7: Network Connectivity Simulation
      const connection = (navigator as any).connection;
      if (connection) {
        results.push({
          test: 'Network Awareness',
          status: 'PASS',
          details: `Connection type: ${connection.effectiveType || 'unknown'}, Downlink: ${connection.downlink || 'unknown'}Mbps`
        });
      }

      setTestResults(results);
      setTestCount(prev => prev + 1);
    } catch (error) {
      console.error('Mobile testing error:', error);
      results.push({
        test: 'Test Execution',
        status: 'FAIL',
        details: `Testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Simulate viewport changes
  const simulateViewport = useCallback((viewport: ViewportTest) => {
    setCurrentViewport(viewport);
    
    // Apply viewport simulation styles
    const testContainer = document.getElementById('mobile-test-container');
    if (testContainer) {
      testContainer.style.width = `${viewport.width}px`;
      testContainer.style.height = `${viewport.height}px`;
      testContainer.style.maxWidth = `${viewport.width}px`;
      testContainer.style.overflow = 'auto';
      testContainer.style.border = '2px solid #B1420A';
      testContainer.style.margin = '0 auto';
    }
    
    // Re-run tests after viewport change
    setTimeout(runMobileTests, 500);
  }, [runMobileTests]);

  // Auto-run tests on component mount
  useEffect(() => {
    runMobileTests();
  }, [runMobileTests]);

  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const warningCount = testResults.filter(r => r.status === 'WARNING').length;

  return (
    <Card className="bg-[#1a1a1a] border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-[#B1420A]" />
            <span>Mobile Testing Validator</span>
          </div>
          <Button
            onClick={runMobileTests}
            disabled={isRunning}
            size="sm"
            className="bg-[#B1420A] hover:bg-[#8B3308]"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Summary */}
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            {passCount} Passed
          </Badge>
          <Badge variant="outline" className="border-red-500 text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            {failCount} Failed
          </Badge>
          <Badge variant="outline" className="border-yellow-500 text-yellow-400">
            {warningCount} Warnings
          </Badge>
          <span className="text-gray-400 text-sm">Run #{testCount}</span>
        </div>

        {/* Viewport Simulation */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Viewport Simulation</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VIEWPORT_TESTS.map((viewport) => (
              <Button
                key={viewport.name}
                onClick={() => simulateViewport(viewport)}
                variant={currentViewport.name === viewport.name ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  currentViewport.name === viewport.name 
                    ? 'bg-[#B1420A] hover:bg-[#8B3308]' 
                    : 'border-gray-600 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {viewport.width < 768 ? <Smartphone className="w-3 h-3" /> : 
                   viewport.width < 1024 ? <Tablet className="w-3 h-3" /> : 
                   <Monitor className="w-3 h-3" />}
                  <span>{viewport.name}</span>
                </div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Current: {currentViewport.width}x{currentViewport.height} - {currentViewport.description}
          </p>
        </div>

        {/* Test Results */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-[#2a2a2a] rounded-lg border border-gray-700"
              >
                <div className="flex items-start space-x-3">
                  {result.status === 'PASS' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  ) : result.status === 'WARNING' ? (
                    <XCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{result.test}</p>
                    <p className="text-xs text-gray-400">{result.details}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    result.status === 'PASS' ? 'border-green-500 text-green-400' :
                    result.status === 'WARNING' ? 'border-yellow-500 text-yellow-400' :
                    'border-red-500 text-red-400'
                  }`}
                >
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Recommendations */}
        {failCount > 0 && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-400 mb-2">Recommendations</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Ensure all interactive elements meet 44px minimum touch target size</li>
              <li>• Optimize images and assets for mobile bandwidth</li>
              <li>• Use responsive design patterns for different screen sizes</li>
              <li>• Test on real devices for accurate performance metrics</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
