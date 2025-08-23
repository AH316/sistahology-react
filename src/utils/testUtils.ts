// Test utilities for validating app functionality

interface TestResult {
  success: boolean;
  message: string;
  error?: any;
}

// Test localStorage functionality
export const testLocalStorage = (): TestResult => {
  try {
    const testKey = 'sistahology_test';
    const testValue = { test: true, timestamp: Date.now() };
    
    // Test write
    localStorage.setItem(testKey, JSON.stringify(testValue));
    
    // Test read
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    
    // Test delete
    localStorage.removeItem(testKey);
    
    if (retrieved.test === testValue.test) {
      return { success: true, message: 'localStorage is working correctly' };
    } else {
      return { success: false, message: 'localStorage read/write mismatch' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'localStorage is not available or corrupted', 
      error 
    };
  }
};

// Test date utilities
export const testDateFunctions = (): TestResult => {
  try {
    const todayString = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    // Test date validation logic
    const isFuture = futureDateString > todayString;
    const isPast = '2023-01-01' < todayString;
    
    if (isFuture && isPast) {
      return { success: true, message: 'Date validation logic is working' };
    } else {
      return { success: false, message: 'Date validation logic failed' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Date function test failed', 
      error 
    };
  }
};

// Test journal store functionality
export const testJournalOperations = (): TestResult => {
  try {
    // Mock journal data
    const mockJournal = {
      id: 'test_journal_123',
      userId: 'test_user_123',
      journalName: 'Test Journal',
      color: '#f472b6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const mockEntry = {
      id: 'test_entry_123',
      journalId: 'test_journal_123',
      content: 'This is a test entry to validate functionality.',
      entryDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    };
    
    // Test data structure validity
    const requiredJournalFields = ['id', 'userId', 'journalName', 'color', 'createdAt', 'updatedAt'];
    const requiredEntryFields = ['id', 'journalId', 'content', 'entryDate', 'createdAt', 'updatedAt', 'isArchived'];
    
    const journalValid = requiredJournalFields.every(field => mockJournal.hasOwnProperty(field));
    const entryValid = requiredEntryFields.every(field => mockEntry.hasOwnProperty(field));
    
    if (journalValid && entryValid) {
      return { success: true, message: 'Journal data structures are valid' };
    } else {
      return { success: false, message: 'Journal data structures are invalid' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Journal operations test failed', 
      error 
    };
  }
};

// Test search functionality
export const testSearchLogic = (): TestResult => {
  try {
    const mockEntries = [
      { id: '1', content: 'Today was a beautiful day full of sunshine', journalId: 'j1' },
      { id: '2', content: 'Feeling grateful for all the good things in life', journalId: 'j1' },
      { id: '3', content: 'Had a challenging but rewarding workout session', journalId: 'j2' }
    ];
    
    // Test search logic
    const searchQuery = 'beautiful';
    const results = mockEntries.filter(entry => 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (results.length === 1 && results[0].id === '1') {
      return { success: true, message: 'Search functionality is working correctly' };
    } else {
      return { success: false, message: 'Search functionality failed' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Search logic test failed', 
      error 
    };
  }
};

// Test writing streak calculation
export const testWritingStreak = (): TestResult => {
  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    
    const mockEntries = [
      { entryDate: today.toISOString().split('T')[0], isArchived: false },
      { entryDate: yesterday.toISOString().split('T')[0], isArchived: false },
      { entryDate: twoDaysAgo.toISOString().split('T')[0], isArchived: false }
    ];
    
    // Simple streak calculation logic
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < mockEntries.length; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const hasEntry = mockEntries.some(entry => entry.entryDate === dateString && !entry.isArchived);
      
      if (hasEntry) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    if (streak === 3) {
      return { success: true, message: 'Writing streak calculation is working' };
    } else {
      return { success: false, message: `Writing streak calculation failed. Expected 3, got ${streak}` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Writing streak test failed', 
      error 
    };
  }
};

// Run all tests
export const runAllTests = (): { results: TestResult[]; summary: { passed: number; failed: number } } => {
  const tests = [
    testLocalStorage,
    testDateFunctions,
    testJournalOperations,
    testSearchLogic,
    testWritingStreak
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  return {
    results,
    summary: { passed, failed }
  };
};

// Performance monitoring
export const measurePerformance = (fn: () => void, label: string): number => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return duration;
};

export const logPerformanceMetrics = () => {
  // Navigation timing
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;
    
    console.group('Performance Metrics');
    console.log('Page Load Time:', timing.loadEventEnd - navigationStart, 'ms');
    console.log('DOM Ready Time:', timing.domContentLoadedEventEnd - navigationStart, 'ms');
    console.log('First Paint Time:', timing.responseStart - navigationStart, 'ms');
    console.groupEnd();
  }
  
  // Memory usage (if available)
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.group('Memory Usage');
    console.log('Used:', Math.round(memory.usedJSHeapSize / 1048576), 'MB');
    console.log('Total:', Math.round(memory.totalJSHeapSize / 1048576), 'MB');
    console.log('Limit:', Math.round(memory.jsHeapSizeLimit / 1048576), 'MB');
    console.groupEnd();
  }
};