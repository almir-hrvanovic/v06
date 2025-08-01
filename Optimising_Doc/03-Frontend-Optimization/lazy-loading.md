# Lazy Loading Implementation Guide

## Overview
Implement comprehensive lazy loading strategies to reduce initial page load by 60% and improve perceived performance.

## Lazy Loading Strategies

### 1. Route-Based Lazy Loading

#### Next.js Dynamic Routes
```typescript
// app/dashboard/layout.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy dashboard sections
const Analytics = dynamic(() => import('./analytics/page'), {
  loading: () => <AnalyticsSkeleton />,
});

const Reports = dynamic(() => import('./reports/page'), {
  loading: () => <ReportsSkeleton />,
});

const Settings = dynamic(() => import('./settings/page'), {
  loading: () => <SettingsSkeleton />,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<DashboardLoading />}>
        {children}
      </Suspense>
    </div>
  );
}
```

#### Route Prefetching Strategy
```typescript
// components/NavigationWithPrefetch.tsx
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function NavigationLink({ href, children }: NavLinkProps) {
  const router = useRouter();
  
  const handleMouseEnter = () => {
    // Prefetch on hover
    router.prefetch(href);
  };
  
  const handleFocus = () => {
    // Prefetch on focus (keyboard navigation)
    router.prefetch(href);
  };
  
  return (
    <Link 
      href={href}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      prefetch={false} // Disable automatic prefetching
    >
      {children}
    </Link>
  );
}
```

### 2. Component-Level Lazy Loading

#### Heavy Component Loading
```typescript
// components/DataVisualization.tsx
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const Chart = dynamic(
  () => import('@/components/charts/ComplexChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export function DataVisualization({ data }: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  useEffect(() => {
    // Load after initial render
    const timer = setTimeout(() => setShouldLoad(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!shouldLoad) {
    return <ChartSkeleton />;
  }
  
  return <Chart data={data} />;
}
```

#### Conditional Component Loading
```typescript
// components/FeatureFlag.tsx
interface FeatureComponentProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const featureComponents = {
  'advanced-analytics': () => import('./AdvancedAnalytics'),
  'ai-insights': () => import('./AIInsights'),
  'export-tools': () => import('./ExportTools'),
};

export function FeatureComponent({ feature, fallback, children }: FeatureComponentProps) {
  const [Component, setComponent] = useState<any>(null);
  
  useEffect(() => {
    if (featureComponents[feature] && isFeatureEnabled(feature)) {
      featureComponents[feature]().then(mod => {
        setComponent(() => mod.default);
      });
    }
  }, [feature]);
  
  if (!Component) {
    return fallback || null;
  }
  
  return <Component>{children}</Component>;
}
```

### 3. Image Lazy Loading

#### Next.js Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  priority = false,
  className 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={`/_next/image?url=${src}&w=16&q=1`}
        onLoadingComplete={() => setIsLoading(false)}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
      />
    </div>
  );
}
```

#### Progressive Image Loading
```typescript
// hooks/useProgressiveImage.ts
export function useProgressiveImage(src: string) {
  const [sourceLoaded, setSourceLoaded] = useState<string | null>(null);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setSourceLoaded(src);
  }, [src]);
  
  return sourceLoaded;
}

// Usage
function Hero({ heroImage }: Props) {
  const loaded = useProgressiveImage(heroImage);
  
  return (
    <div 
      className="hero"
      style={{
        backgroundImage: `url(${loaded || '/placeholder.jpg'})`,
        filter: loaded ? 'none' : 'blur(5px)',
        transition: 'filter 0.5s ease-out'
      }}
    />
  );
}
```

### 4. Data Lazy Loading

#### Infinite Scroll Implementation
```typescript
// hooks/useInfiniteScroll.ts
import { useCallback, useEffect, useRef } from 'react';

export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean
) {
  const observer = useRef<IntersectionObserver>();
  
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (!hasMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [callback, hasMore]);
  
  return lastElementRef;
}

// Usage in component
function ItemList() {
  const { data, loading, hasMore, loadMore } = usePaginatedData();
  const lastItemRef = useInfiniteScroll(loadMore, hasMore);
  
  return (
    <div>
      {data.map((item, index) => (
        <div 
          key={item.id}
          ref={index === data.length - 1 ? lastItemRef : null}
        >
          <ItemCard item={item} />
        </div>
      ))}
      {loading && <LoadingSpinner />}
    </div>
  );
}
```

#### Virtual Scrolling for Large Lists
```typescript
// components/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
}

export function VirtualList<T>({ 
  items, 
  renderItem, 
  itemHeight 
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Third-Party Script Loading

#### Optimized Script Loading
```typescript
// components/ThirdPartyScripts.tsx
import Script from 'next/script';

export function ThirdPartyScripts() {
  return (
    <>
      {/* Analytics - Load after interactive */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      
      {/* Chat widget - Load on user interaction */}
      <Script
        id="chat-widget"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('[Script] Chat widget loaded');
        }}
      >
        {`
          window.intercomSettings = {
            app_id: "YOUR_APP_ID"
          };
        `}
      </Script>
      
      {/* Critical monitoring - Load immediately */}
      <Script
        src="/scripts/error-tracking.js"
        strategy="beforeInteractive"
      />
    </>
  );
}
```

### 6. CSS Lazy Loading

#### Critical CSS Extraction
```typescript
// next.config.js
const CriticalCssPlugin = require('critical-css-webpack-plugin');

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CriticalCssPlugin({
          base: '.next',
          src: 'static/css/[name].css',
          dest: 'static/css/[name].critical.css',
          inline: true,
          minify: true,
          extract: true,
        })
      );
    }
    return config;
  },
};
```

#### Component-Specific CSS Loading
```typescript
// components/HeavyComponent.tsx
import { useEffect, useState } from 'react';

export function HeavyComponent() {
  const [stylesLoaded, setStylesLoaded] = useState(false);
  
  useEffect(() => {
    // Dynamically import CSS
    import('./HeavyComponent.module.css').then(() => {
      setStylesLoaded(true);
    });
  }, []);
  
  if (!stylesLoaded) {
    return <div>Loading styles...</div>;
  }
  
  return (
    <div className="heavy-component">
      {/* Component content */}
    </div>
  );
}
```

## Performance Monitoring

### Lazy Loading Metrics
```typescript
// utils/performance-monitor.ts
export class LazyLoadMonitor {
  private metrics: Map<string, number> = new Map();
  
  startTracking(componentName: string) {
    this.metrics.set(componentName, performance.now());
  }
  
  endTracking(componentName: string) {
    const startTime = this.metrics.get(componentName);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      console.log(`[LazyLoad] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'lazy_load', {
          component: componentName,
          load_time: loadTime,
        });
      }
    }
  }
}

export const lazyLoadMonitor = new LazyLoadMonitor();
```

## Best Practices

### 1. Loading States
```typescript
// components/LoadingStates.tsx
export const SkeletonLoader = ({ type }: { type: string }) => {
  const skeletons = {
    card: <CardSkeleton />,
    table: <TableSkeleton />,
    chart: <ChartSkeleton />,
    form: <FormSkeleton />,
  };
  
  return skeletons[type] || <DefaultSkeleton />;
};
```

### 2. Error Boundaries
```typescript
// components/LazyErrorBoundary.tsx
export function LazyErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-state">
          <p>Failed to load component</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Success Metrics
- [ ] Initial JS payload < 200KB
- [ ] LCP < 2.5 seconds
- [ ] Images load progressively
- [ ] No layout shift from lazy loading
- [ ] 90% of content above fold loads immediately
- [ ] Heavy features load on-demand

---
*Implementation Priority: HIGH*