# i18n Testing Protocol - Comprehensive Guide

Complete automated testing protocol for internationalization (i18n) functionality in the GS-CMS Enterprise project.

## 📋 Overview

This testing protocol ensures comprehensive validation of the 4-language i18n implementation (Croatian/hr, Bosnian/bs, English/en, German/de) across all aspects:
- Translation key existence and consistency
- Language switching functionality 
- Visual layout consistency
- Translation key usage verification
- Orphaned key detection
- Performance optimization

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install additional testing dependencies
npm install --save-dev @playwright/test pixelmatch glob tsx

# Install jest if not present
npm install --save-dev jest @jest/types @testing-library/react @testing-library/jest-dom
```

### Run All Tests

```bash
# Run the complete i18n testing suite
npm run test:i18n

# Or run individual test categories
npm run test:i18n:keys        # Translation key tests
npm run test:i18n:switching   # Language switching tests
npm run test:i18n:visual      # Visual regression tests
npm run test:i18n:performance # Performance tests
```

## 📁 Test Files Structure

```
__tests__/i18n/
├── translation-keys.test.ts       # Unit tests for key existence
├── language-switching.test.tsx     # Integration tests for switching
├── visual-regression.test.ts       # Visual layout tests
└── translation-performance.test.ts # Performance tests

scripts/
├── verify-translation-usage.ts    # Usage verification script
├── find-orphaned-keys.ts         # Orphaned keys finder
└── i18n-test-runner.ts           # Test orchestration script

__tests__/screenshots/i18n/        # Visual regression screenshots
translation-usage-report.json      # Usage analysis report
orphaned-keys-report.json         # Orphaned keys report
```

## 🧪 Test Categories

### 1. Translation Key Existence Tests

**Purpose**: Verify all required translation keys exist across all languages

**Test File**: `__tests__/i18n/translation-keys.test.ts`

```bash
# Run key existence tests
npm test __tests__/i18n/translation-keys.test.ts

# Or with Jest directly
npx jest __tests__/i18n/translation-keys.test.ts --verbose
```

**What it tests**:
- ✅ Translation file validity (valid JSON)
- ✅ Metadata sections exist
- ✅ Required category existence
- ✅ All action keys present
- ✅ Status and priority keys
- ✅ Form placeholder keys
- ✅ Header and empty state keys
- ✅ Key consistency across languages
- ✅ No empty translation values
- ✅ Translation quality checks

**Expected Output**:
```
✓ should load valid JSON for en
✓ should load valid JSON for hr  
✓ should load valid JSON for bs
✓ should load valid JSON for de
✓ should have all required categories for en
✓ should have all action keys for en
✓ should have same key structure across all languages
✓ should have no empty translation values
✓ should not have placeholder text patterns for hr
```

### 2. Language Switching Integration Tests

**Purpose**: Test language switching functionality and UI updates

**Test File**: `__tests__/i18n/language-switching.test.tsx`

```bash
# Run language switching tests
npm test __tests__/i18n/language-switching.test.tsx

# Run with coverage
npx jest __tests__/i18n/language-switching.test.tsx --coverage
```

**What it tests**:
- ✅ Language switcher component rendering
- ✅ Dropdown shows all supported languages
- ✅ Language change handling
- ✅ Component translation updates
- ✅ Form validation message switching
- ✅ Date and number formatting
- ✅ Pluralization across languages
- ✅ Fallback behavior for missing keys
- ✅ Cookie persistence

**Expected Output**:
```
✓ should render language switcher with current locale
✓ should show all supported languages in dropdown
✓ should handle language change
✓ should update header navigation labels when language changes
✓ should update mobile sidebar when language changes
✓ should display validation messages in selected language
✓ should format dates according to locale
✓ should handle pluralization correctly across languages
```

### 3. Visual Regression Tests

**Purpose**: Ensure UI layouts remain consistent across different languages

**Test File**: `__tests__/i18n/visual-regression.test.ts`

```bash
# Run visual regression tests (requires Playwright)
npx playwright test __tests__/i18n/visual-regression.test.ts

# Or with npm script
npm run test:visual:i18n
```

**What it tests**:
- ✅ Desktop layout consistency
- ✅ Mobile layout consistency
- ✅ Text overflow handling
- ✅ Croatian diacritics rendering
- ✅ Form layout consistency
- ✅ Button and UI element sizing
- ✅ German text length handling

**Expected Output**:
```
✓ should maintain layout consistency for signin page across languages
✓ should maintain layout consistency for dashboard page across languages
✓ should maintain mobile layout for mobile-portrait viewport
✓ should handle long German text without breaking layout
✓ should handle Croatian diacritics correctly
✓ should maintain form layouts across languages
✓ should maintain consistent button sizes across languages
```

**Generated Files**:
- Screenshots saved to `__tests__/screenshots/i18n/`
- Individual screenshots for each language/page combination
- Comparison reports for layout dimension analysis

### 4. Performance Tests

**Purpose**: Validate translation loading and rendering performance

**Test File**: `__tests__/i18n/translation-performance.test.ts`

```bash
# Run performance tests
npm test __tests__/i18n/translation-performance.test.ts

# Run with memory profiling
node --expose-gc npx jest __tests__/i18n/translation-performance.test.ts
```

**What it tests**:
- ✅ Translation loading speed
- ✅ Concurrent loading performance
- ✅ Rendering performance per language
- ✅ Rapid language switching
- ✅ Dynamic translation efficiency
- ✅ Performance over iterations
- ✅ Memory leak detection
- ✅ Large object handling

**Performance Thresholds**:
- Translation loading: < 50ms
- Component rendering: < 100ms
- Memory increase: < 10MB
- Language switching: < 100ms average

**Expected Output**:
```
✓ should load en translations within performance budget
✓ should handle concurrent translation loading
✓ should render hr translations within performance budget
✓ should handle rapid language switching
✓ should handle many dynamic translations efficiently
✓ should maintain performance over multiple iterations
✓ should not have significant memory leaks
```

## 🔧 Analysis Scripts

### Translation Usage Verification

**Purpose**: Scan codebase to verify all translation keys are actually used

**Script**: `scripts/verify-translation-usage.ts`

```bash
# Run usage verification
npx tsx scripts/verify-translation-usage.ts

# Run with verbose output
npx tsx scripts/verify-translation-usage.ts --verbose

# Generate report
npx tsx scripts/verify-translation-usage.ts > usage-analysis.log
```

**What it analyzes**:
- Scans all source files for translation key usage
- Identifies unused translation keys
- Finds missing keys (referenced but not defined)
- Calculates usage percentage
- Provides actionable recommendations

**Sample Output**:
```
🔍 Starting translation usage analysis...
📝 Loading translation keys...
📁 Finding source files...
   Found 247 source files
🔍 Scanning for used translation keys...
   Found 1,245 translation key references
   Identified 987 unique keys

📋 Translation Usage Report Summary
=====================================
Total translation keys: 1,711
Used keys: 987
Usage percentage: 57.7%
Unused keys: 724
Missing keys: 3

🎯 Recommended Actions:
   • Remove 724 unused translation keys
   • Add 3 missing translation keys
   • Review translation key usage - low utilization detected
```

### Orphaned Keys Detection

**Purpose**: Find translation keys that exist in some languages but not others

**Script**: `scripts/find-orphaned-keys.ts`

```bash
# Find orphaned keys
npx tsx scripts/find-orphaned-keys.ts

# Auto-fix issues
npx tsx scripts/find-orphaned-keys.ts --fix

# Verbose output with details
npx tsx scripts/find-orphaned-keys.ts --verbose
```

**What it finds**:
- Keys missing from specific languages
- Structural inconsistencies
- Empty or null values
- Type mismatches between languages

**Sample Output**:
```
🔍 Starting orphaned keys analysis...
📝 Loading all translation files...
🔑 Extracting keys from all languages...

📋 Orphaned Keys Report Summary
================================
Total orphaned keys: 12
Total inconsistencies: 5
Affected languages: bs, de

📊 Language Comparison:
   en: 1711 keys, 0 missing, 0 extra
   hr: 1708 keys, 3 missing, 0 extra
   bs: 1705 keys, 6 missing, 0 extra
   de: 1709 keys, 2 missing, 0 extra

🎯 Recommended Actions:
   • Add 12 missing translation keys
   • Focus on bs - most missing keys
   • Fix 5 empty translation values
```

## 📊 Automated Test Runner

Create a master test runner script for orchestrating all tests:

**Script**: `scripts/i18n-test-runner.ts`

```bash
# Run complete i18n test suite
npx tsx scripts/i18n-test-runner.ts

# Run specific test categories
npx tsx scripts/i18n-test-runner.ts --category=keys
npx tsx scripts/i18n-test-runner.ts --category=performance

# Generate comprehensive report
npx tsx scripts/i18n-test-runner.ts --report
```

## 🛠️ Setup Instructions

### 1. Add NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:i18n": "npx tsx scripts/i18n-test-runner.ts",
    "test:i18n:keys": "jest __tests__/i18n/translation-keys.test.ts",
    "test:i18n:switching": "jest __tests__/i18n/language-switching.test.tsx",
    "test:i18n:visual": "playwright test __tests__/i18n/visual-regression.test.ts",
    "test:i18n:performance": "jest __tests__/i18n/translation-performance.test.ts",
    "i18n:verify-usage": "npx tsx scripts/verify-translation-usage.ts",
    "i18n:find-orphaned": "npx tsx scripts/find-orphaned-keys.ts",
    "i18n:fix-orphaned": "npx tsx scripts/find-orphaned-keys.ts --fix",
    "i18n:analyze": "npm run i18n:verify-usage && npm run i18n:find-orphaned"
  }
}
```

### 2. Configure Jest for i18n Testing

**File**: `jest.config.i18n.js`

```javascript
module.exports = {
  displayName: 'i18n Tests',
  testMatch: ['**/__tests__/i18n/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.i18n.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'messages/**/*.json',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
}
```

### 3. Configure Playwright for Visual Tests

**File**: `playwright.config.i18n.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/i18n',
  testMatch: '**/visual-regression.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

## 🎯 CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/i18n-tests.yml`

```yaml
name: i18n Testing Protocol

on:
  push:
    branches: [ main, develop ]
    paths: 
      - 'messages/**'
      - 'src/**'
      - '__tests__/i18n/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'messages/**'
      - 'src/**'

jobs:
  i18n-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run translation key tests
      run: npm run test:i18n:keys
    
    - name: Run language switching tests
      run: npm run test:i18n:switching
    
    - name: Run performance tests
      run: npm run test:i18n:performance
    
    - name: Verify translation usage
      run: npm run i18n:verify-usage
    
    - name: Find orphaned keys
      run: npm run i18n:find-orphaned
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run visual regression tests
      run: npm run test:i18n:visual
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: i18n-test-results
        path: |
          translation-usage-report.json
          orphaned-keys-report.json
          __tests__/screenshots/i18n/
```

## 📈 Monitoring and Reporting

### Translation Health Dashboard

Create a monitoring dashboard to track i18n health:

```bash
# Generate health report
npx tsx scripts/i18n-health-dashboard.ts

# Schedule regular checks (cron example)
0 9 * * 1 cd /path/to/project && npm run i18n:analyze
```

### Key Metrics to Track

- **Translation Coverage**: Percentage of keys translated per language
- **Usage Efficiency**: Percentage of translation keys actually used
- **Consistency Score**: Structural consistency across languages
- **Performance Metrics**: Load times and rendering performance
- **Error Rates**: Missing keys, empty values, type mismatches

## 🚨 Troubleshooting

### Common Issues

**1. Translation files not found**
```bash
# Verify files exist
ls -la messages/
# Expected: en.json, hr.json, bs.json, de.json
```

**2. Jest configuration issues**
```bash
# Clear Jest cache
npx jest --clearCache

# Run with debug
npx jest --detectOpenHandles --forceExit
```

**3. Playwright browser issues**
```bash
# Reinstall browsers
npx playwright install --with-deps chromium
```

**4. Memory issues in performance tests**
```bash
# Run with increased memory
node --max-old-space-size=4096 npx jest performance.test.ts
```

### Performance Optimization

**If tests are slow**:
- Run tests in parallel: `jest --maxWorkers=4`
- Use test filtering: `jest --testNamePattern="English"`
- Cache translation loading between tests

**If visual tests fail**:
- Check baseline screenshots exist
- Update screenshots: `playwright test --update-snapshots`
- Verify test environment consistency

## ✅ Success Criteria

### Test Suite Passing Criteria

All tests should pass with these minimum requirements:

**Translation Keys**: 
- ✅ 100% key consistency across languages
- ✅ No empty or missing required keys
- ✅ Proper metadata in all language files

**Language Switching**:
- ✅ All components update translations correctly
- ✅ Date/number formatting works per locale
- ✅ Pluralization follows language rules
- ✅ Cookie persistence functions

**Visual Consistency**:
- ✅ No layout breaking across languages
- ✅ Text overflow handled gracefully
- ✅ Button sizes remain consistent
- ✅ Diacritics render properly

**Performance**:
- ✅ Translation loading < 50ms per language
- ✅ Component rendering < 100ms
- ✅ Memory usage < 10MB increase
- ✅ No memory leaks detected

**Usage Analysis**:
- ✅ >80% translation key utilization
- ✅ <5 orphaned keys per language
- ✅ All referenced keys exist

### Quality Gates

Before deploying i18n changes:

1. **Run full test suite**: `npm run test:i18n`
2. **Check usage efficiency**: `npm run i18n:verify-usage`
3. **Verify key consistency**: `npm run i18n:find-orphaned`
4. **Review visual changes**: Check screenshot diffs
5. **Validate performance**: Ensure benchmarks met

## 📚 Additional Resources

- [Next.js Internationalization Guide](https://nextjs.org/docs/advanced-features/i18n)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

---

**Created**: January 2025  
**Version**: 1.0  
**Maintainer**: GS-CMS Development Team

This comprehensive testing protocol ensures robust, maintainable, and performant internationalization implementation across the entire GS-CMS Enterprise application.