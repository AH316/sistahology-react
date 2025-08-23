import React, { useState } from 'react';
import { runAllTests, logPerformanceMetrics } from '../utils/testUtils';
import { Settings, Play, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleRunTests = async () => {
    setIsRunning(true);
    
    // Simulate some delay for testing UI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results = runAllTests();
    setTestResults(results);
    setIsRunning(false);
  };

  const handlePerformanceCheck = () => {
    logPerformanceMetrics();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Developer Tools"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Dev Tools</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Test Runner */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Function Tests</span>
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunning ? (
                <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
          
          {testResults && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span>Results:</span>
                <span className={`px-2 py-1 rounded ${
                  testResults.summary.failed === 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.summary.passed}/{testResults.results.length} passed
                </span>
              </div>
              
              {testResults.results.map((result: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Performance Monitor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Performance</span>
            <button
              onClick={handlePerformanceCheck}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Check</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Results logged to browser console
          </p>
        </div>
        
        {/* App Info */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div>Mode: {process.env.NODE_ENV}</div>
          <div>React: {React.version}</div>
          <div>Build: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
};

export default DevTools;