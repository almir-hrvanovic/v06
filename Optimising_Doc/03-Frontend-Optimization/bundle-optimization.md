# Bundle Optimization Guide

## Overview
Reduce JavaScript bundle size by 70%+ through code splitting, tree shaking, and lazy loading strategies.

## Current Bundle Analysis

### Bundle Size Baseline
```bash
# Analyze current bundle
npm run build
npm run analyze

# Current sizes (estimated):
# - Main bundle: 2.5 MB (uncompressed)
# - Vendor bundle: 1.8 MB
# - Total: 4.3 MB
# - Gzipped: 1.2 MB
```

### Bundle Composition
- React + React DOM: ~150KB
- Next.js framework: ~90KB
- UI Libraries: ~500KB
- Business Logic: ~800KB
- Unused code: ~40%

## Optimization Strategies

### 1. Code Splitting

#### Route-Based Splitting
```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

// Before: Everything loaded upfront
// import HeavyComponent from '@/components/HeavyComponent';

// After: Load only when needed
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <div>Loading...</div>,
    ssr: false // Skip SSR for client-only components
  }
);
```

#### Component-Level Splitting
```typescript
// components/Analytics.tsx
const ChartComponent = dynamic(
  () => import('@/components/charts/ChartComponent').then(mod => mod.ChartComponent),
  {
    loading: () => <Skeleton height={400} />,
    // Preload on hover
    onLoad: () => console.log('[Bundle] Chart component loaded')
  }
);

// Preload strategy
export function preloadAnalytics() {
  import('@/components/charts/ChartComponent');
}
```

### 2. Tree Shaking Optimization

#### Remove Unused Imports
```typescript
// Before: Importing entire library
import * as _ from 'lodash';
const result = _.debounce(fn, 300);

// After: Import only what's needed
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// Or use native alternatives
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
```

#### Optimize Icon Imports
```typescript
// Before: Imports entire icon library
import { FaUser, FaHome, FaSettings } from 'react-icons/fa';

// After: Direct imports
import FaUser from 'react-icons/fa/FaUser';
import FaHome from 'react-icons/fa/FaHome';
import FaSettings from 'react-icons/fa/FaSettings';
```

### 3. Bundle Configuration

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Bundle analyzer in development
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Replace react with preact in production
      Object.assign(config.resolve.alias, {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      });
    }
    
    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };
    
    return config;
  },
};
```

### 4. Lazy Loading Strategies

#### Intersection Observer for Components
```typescript
// hooks/useIntersectionLoader.ts
export function useIntersectionLoader(
  componentPath: string,
  options?: IntersectionObserverInit
) {
  const [Component, setComponent] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !Component) {
          import(componentPath).then(mod => {
            setComponent(() => mod.default);
          });
        }
      },
      options
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [componentPath, Component, options]);
  
  return { Component, ref };
}

// Usage
function Dashboard() {
  const { Component: Analytics, ref } = useIntersectionLoader(
    '@/components/Analytics'
  );
  
  return (
    <div>
      <div ref={ref} style={{ minHeight: 400 }}>
        {Analytics ? <Analytics /> : <Skeleton />}
      </div>
    </div>
  );
}
```

#### Progressive Image Loading
```typescript
// components/ProgressiveImage.tsx
export function ProgressiveImage({ src, alt, ...props }: ImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(
    `${src}?w=20&blur=10` // Low quality placeholder
  );
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
  }, [src]);
  
  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      placeholder="blur"
      className={cn(props.className, {
        'blur-sm': imageSrc.includes('blur'),
      })}
    />
  );
}
```

### 5. External Dependencies Optimization

#### CDN for Large Libraries
```html
<!-- app/layout.tsx -->
<Script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  strategy="beforeInteractive"
/>
<Script
  src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
  strategy="beforeInteractive"
/>

<!-- Configure webpack to use externals -->
```

#### Optimize Package Imports
```json
// package.json
{
  "sideEffects": false,
  "module": "dist/index.esm.js",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    },
    "./styles": "./dist/styles.css"
  }
}
```

### 6. Build Optimization

#### Production Build Script
```bash
#!/bin/bash
# build-optimized.sh

# Clean previous builds
rm -rf .next

# Set production environment
export NODE_ENV=production
export ANALYZE=true

# Build with optimizations
npm run build

# Generate bundle report
npx webpack-bundle-analyzer .next/stats.json -m static -r bundle-report.html

# Compress static assets
find .next/static -type f \( -name "*.js" -o -name "*.css" \) -exec gzip -9 -k {} \;

# Generate brotli compression
find .next/static -type f \( -name "*.js" -o -name "*.css" \) -exec brotli -q 11 {} \;
```

## Monitoring Bundle Size

### Automated Size Checking
```javascript
// scripts/check-bundle-size.js
const fs = require('fs');
const path = require('path');

const MAX_SIZES = {
  'main.js': 500 * 1024,      // 500KB
  'vendor.js': 300 * 1024,    // 300KB
  'total': 1024 * 1024        // 1MB
};

function checkBundleSize() {
  const buildDir = path.join(__dirname, '../.next/static/chunks');
  let totalSize = 0;
  const violations = [];
  
  fs.readdirSync(buildDir).forEach(file => {
    const stats = fs.statSync(path.join(buildDir, file));
    totalSize += stats.size;
    
    if (MAX_SIZES[file] && stats.size > MAX_SIZES[file]) {
      violations.push({
        file,
        size: stats.size,
        limit: MAX_SIZES[file]
      });
    }
  });
  
  if (totalSize > MAX_SIZES.total) {
    violations.push({
      file: 'total',
      size: totalSize,
      limit: MAX_SIZES.total
    });
  }
  
  if (violations.length > 0) {
    console.error('Bundle size violations:', violations);
    process.exit(1);
  }
  
  console.log('Bundle size check passed');
}

checkBundleSize();
```

### CI Integration
```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check
on: [pull_request]

jobs:
  size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: node scripts/check-bundle-size.js
      - uses: actions/upload-artifact@v2
        with:
          name: bundle-report
          path: bundle-report.html
```

## Performance Impact

### Expected Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Bundle | 4.3 MB | 1.2 MB | 72% smaller |
| Main Chunk | 2.5 MB | 500 KB | 80% smaller |
| Parse Time | 800ms | 200ms | 75% faster |
| Load Time | 5s | 1.5s | 70% faster |

### Loading Strategy
1. **Initial Load**: Core app shell (< 200KB)
2. **Route Load**: Page-specific bundles (< 100KB each)
3. **On-Demand**: Features loaded as needed
4. **Prefetch**: Next routes preloaded

## Troubleshooting

### Common Issues

#### Issue: Dynamic imports not working
```typescript
// Solution: Ensure proper webpack configuration
const DynamicComponent = dynamic(
  () => import('../components/Heavy').then(mod => mod.default),
  { ssr: false }
);
```

#### Issue: Tree shaking not removing code
```javascript
// Check sideEffects in package.json
{
  "sideEffects": false, // or ["*.css"]
}
```

## Success Checklist
- [ ] Bundle size < 1.5MB total
- [ ] Main chunk < 500KB
- [ ] All routes code-split
- [ ] Heavy components lazy loaded
- [ ] Bundle analyzer integrated
- [ ] CI size checks enabled
- [ ] Performance budget enforced

---
*Status: Ready for Implementation*