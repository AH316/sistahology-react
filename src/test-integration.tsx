// Test component to verify Supabase integration
import React, { useState } from 'react';
import { supabaseDatabase } from './lib/supabase-database';
import { supabaseAuth } from './lib/supabase-auth';

export const SupabaseIntegrationTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResult('Running tests...\n');

    try {
      // Test 1: Check database connection
      setTestResult(prev => prev + '1. Testing database connection...\n');
      const connected = await supabaseDatabase.checkConnection();
      setTestResult(prev => prev + `   Database connection: ${connected ? '✅ Success' : '❌ Failed'}\n`);

      // Test 2: Test auth (get current user - should be null)
      setTestResult(prev => prev + '2. Testing auth (should show no user)...\n');
      const currentUser = await supabaseAuth.getCurrentUser();
      setTestResult(prev => prev + `   Current user: ${currentUser ? '⚠️ User found' : '✅ No user (expected)'}\n`);

      // Test 3: Try to access tables (should work but return empty)
      setTestResult(prev => prev + '3. Testing table access...\n');
      
      // This should fail with proper auth error for user-specific data
      try {
        const journalsResponse = await supabaseDatabase.journals.getAll('test-user-id');
        setTestResult(prev => prev + `   Journals query: ${journalsResponse.success ? '✅ Success' : '⚠️ ' + journalsResponse.error}\n`);
      } catch (error) {
        setTestResult(prev => prev + `   Journals query: ⚠️ ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }

      setTestResult(prev => prev + '\n🎉 Integration test completed!\n');
      setTestResult(prev => prev + '\n📝 Next steps:\n');
      setTestResult(prev => prev + '- Try registering a new account\n');
      setTestResult(prev => prev + '- Test creating journals and entries\n');
      setTestResult(prev => prev + '- Verify cross-platform sync with Flutter app\n');

    } catch (error) {
      setTestResult(prev => prev + `\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Supabase Integration Test</h2>
      <button 
        onClick={runTests} 
        disabled={isLoading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#f472b6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Running Tests...' : 'Run Integration Test'}
      </button>
      
      {testResult && (
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          marginTop: '20px', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {testResult}
        </pre>
      )}
    </div>
  );
};

export default SupabaseIntegrationTest;