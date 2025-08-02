# CDN Implementation Guide

## Overview
Implement a Content Delivery Network (CDN) to serve static assets globally with < 50ms latency, reducing origin server load by 90%.

## Current Asset Delivery Issues
- All assets served from single origin
- High latency for global users
- Bandwidth costs increasing
- No caching strategy
- Poor performance on mobile networks

## CDN Architecture

### 1. Cloudflare CDN Setup

#### DNS Configuration
```dns
; example.com DNS records
@        A      192.0.2.1       ; Proxied through Cloudflare
www      CNAME  example.com     ; Proxied through Cloudflare
api      A      192.0.2.2       ; Proxied for DDoS protection
assets   CNAME  assets.example.com.cdn.cloudflare.net
```

#### Page Rules Configuration
```
# Rule 1: Cache static assets
URL Pattern: example.com/static/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 week

# Rule 2: Bypass cache for API
URL Pattern: example.com/api/*
Settings:
- Cache Level: Bypass
- Disable Performance

# Rule 3: Cache HTML with short TTL
URL Pattern: example.com/*
Settings:
- Cache Level: Standard
- Edge Cache TTL: 1 hour
- Browser Cache TTL: 10 minutes
```

#### Workers for Edge Computing
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Image optimization at edge
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return handleImageRequest(request);
  }
  
  // API request routing
  if (url.pathname.startsWith('/api/')) {
    return handleAPIRequest(request);
  }
  
  // Default handling with caching
  return handleStaticRequest(request);
}

async function handleImageRequest(request) {
  const url = new URL(request.url);
  const cache = caches.default;
  
  // Check cache first
  let response = await cache.match(request);
  if (response) return response;
  
  // Parse image transformation parameters
  const width = url.searchParams.get('w');
  const quality = url.searchParams.get('q') || '85';
  const format = url.searchParams.get('f') || 'auto';
  
  // Cloudflare Image Resizing
  const imageRequest = new Request(url.toString(), {
    cf: {
      image: {
        width: width ? parseInt(width) : undefined,
        quality: parseInt(quality),
        format: format,
        fit: 'scale-down',
      },
    },
  });
  
  response = await fetch(imageRequest);
  
  // Cache for 30 days
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=2592000');
  headers.set('Vary', 'Accept');
  
  response = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
  
  // Store in cache
  event.waitUntil(cache.put(request, response.clone()));
  
  return response;
}

async function handleAPIRequest(request) {
  // Add geo-location headers
  const country = request.headers.get('CF-IPCountry') || 'US';
  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Country', country);
  
  // Route to nearest API server
  const apiServers = {
    'US': 'https://us.api.example.com',
    'EU': 'https://eu.api.example.com',
    'AS': 'https://asia.api.example.com',
  };
  
  const region = getRegion(country);
  const apiUrl = apiServers[region] || apiServers['US'];
  
  const newUrl = new URL(request.url);
  newUrl.hostname = new URL(apiUrl).hostname;
  
  return fetch(newUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
  });
}
```

### 2. Next.js CDN Integration

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'cloudinary',
    domains: ['res.cloudinary.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.example.com' 
    : '',
  
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|mp4)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/cdn/:path*',
          destination: 'https://cdn.example.com/:path*',
        },
      ],
    };
  },
};
```

#### CDN Asset Component
```typescript
// components/CDNImage.tsx
import { useState, useEffect } from 'react';

interface CDNImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
}

export function CDNImage({ 
  src, 
  alt, 
  width, 
  height, 
  quality = 85,
  priority = false,
  onLoad 
}: CDNImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  
  useEffect(() => {
    // Generate CDN URL with transformations
    const cdnUrl = generateCDNUrl(src, {
      w: width,
      h: height,
      q: quality,
      f: 'auto', // Auto format selection
      dpr: window.devicePixelRatio || 1,
    });
    
    if (priority) {
      // Preload priority images
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = cdnUrl;
      document.head.appendChild(link);
    }
    
    setCurrentSrc(cdnUrl);
  }, [src, width, height, quality, priority]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  return (
    <div className="relative" style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

function generateCDNUrl(
  src: string, 
  params: Record<string, any>
): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.example.com';
  const url = new URL(src, cdnBase);
  
  // Add transformation parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  // Add version for cache busting
  url.searchParams.append('v', process.env.NEXT_PUBLIC_BUILD_ID || '1');
  
  return url.toString();
}
```

### 3. Static Asset Optimization

#### Build-Time Optimization
```javascript
// scripts/optimize-assets.js
const sharp = require('sharp');
const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');

async function optimizeImages() {
  const images = glob.sync('public/**/*.{jpg,jpeg,png}');
  
  for (const imagePath of images) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Generate WebP version
    await image
      .webp({ quality: 85 })
      .toFile(imagePath.replace(/\.(jpg|jpeg|png)$/, '.webp'));
    
    // Generate AVIF version
    await image
      .avif({ quality: 80 })
      .toFile(imagePath.replace(/\.(jpg|jpeg|png)$/, '.avif'));
    
    // Generate responsive sizes
    const sizes = [640, 768, 1024, 1280, 1920];
    for (const size of sizes) {
      if (metadata.width > size) {
        await image
          .resize(size)
          .jpeg({ quality: 85, progressive: true })
          .toFile(imagePath.replace(/(\.[^.]+)$/, `-${size}w$1`));
      }
    }
    
    console.log(`Optimized: ${imagePath}`);
  }
}

// Generate manifest for CDN preloading
async function generateAssetManifest() {
  const assets = glob.sync('public/**/*.{js,css,jpg,jpeg,png,webp,avif,woff2}');
  const manifest = {
    version: process.env.BUILD_ID || Date.now(),
    assets: [],
  };
  
  for (const asset of assets) {
    const stats = await fs.stat(asset);
    const hash = await generateFileHash(asset);
    
    manifest.assets.push({
      path: asset.replace('public/', ''),
      size: stats.size,
      hash,
      type: path.extname(asset).substring(1),
    });
  }
  
  await fs.writeJson('public/asset-manifest.json', manifest, { spaces: 2 });
}

optimizeImages().then(generateAssetManifest);
```

### 4. CDN Cache Strategy

#### Cache Headers Configuration
```typescript
// middleware/cache-headers.ts
export function setCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  
  // Immutable assets (hashed filenames)
  if (path.match(/\.[a-f0-9]{8,}\./)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Images
  else if (path.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }
  // Fonts
  else if (path.match(/\.(woff|woff2|ttf|otf)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // CSS and JS
  else if (path.match(/\.(css|js)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }
  // HTML
  else if (path.match(/\.html$/) || path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  // API responses
  else if (path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
}
```

### 5. CDN Performance Monitoring

```typescript
// lib/cdn-monitor.ts
export class CDNMonitor {
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    bandwidthSaved: 0,
    avgLatency: [],
  };
  
  async checkCDNPerformance() {
    const testAssets = [
      '/static/images/hero.jpg',
      '/static/css/main.css',
      '/static/js/app.js',
    ];
    
    for (const asset of testAssets) {
      const results = await this.testAssetFromMultipleLocations(asset);
      this.analyzeResults(results);
    }
  }
  
  private async testAssetFromMultipleLocations(asset: string) {
    const locations = [
      { name: 'US-East', url: 'https://us-east.cdn.example.com' },
      { name: 'EU-West', url: 'https://eu-west.cdn.example.com' },
      { name: 'Asia-Pacific', url: 'https://asia.cdn.example.com' },
    ];
    
    return Promise.all(
      locations.map(async (location) => {
        const start = Date.now();
        const response = await fetch(`${location.url}${asset}`, {
          method: 'HEAD',
        });
        const latency = Date.now() - start;
        
        return {
          location: location.name,
          latency,
          cacheStatus: response.headers.get('CF-Cache-Status'),
          contentLength: response.headers.get('Content-Length'),
        };
      })
    );
  }
  
  logPerformance() {
    const avgLatency = this.metrics.avgLatency.reduce((a, b) => a + b, 0) / this.metrics.avgLatency.length;
    const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100;
    
    console.log('[CDN Performance]', {
      avgLatency: `${avgLatency.toFixed(2)}ms`,
      cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      bandwidthSaved: `${(this.metrics.bandwidthSaved / 1024 / 1024).toFixed(2)}MB`,
    });
  }
}
```

### 6. Multi-CDN Strategy

```typescript
// lib/multi-cdn.ts
export class MultiCDN {
  private cdnProviders = {
    primary: {
      name: 'Cloudflare',
      url: 'https://cdn.example.com',
      weight: 70,
    },
    secondary: {
      name: 'Fastly',
      url: 'https://fastly.example.com',
      weight: 20,
    },
    fallback: {
      name: 'Origin',
      url: 'https://origin.example.com',
      weight: 10,
    },
  };
  
  getCDNUrl(path: string): string {
    // Weighted random selection
    const random = Math.random() * 100;
    let accumulated = 0;
    
    for (const [key, cdn] of Object.entries(this.cdnProviders)) {
      accumulated += cdn.weight;
      if (random <= accumulated) {
        return `${cdn.url}${path}`;
      }
    }
    
    return `${this.cdnProviders.fallback.url}${path}`;
  }
  
  async getWithFallback(path: string): Promise<Response> {
    const providers = Object.values(this.cdnProviders);
    
    for (const provider of providers) {
      try {
        const response = await fetch(`${provider.url}${path}`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          console.log(`[CDN] Served from ${provider.name}`);
          return response;
        }
      } catch (error) {
        console.error(`[CDN] ${provider.name} failed:`, error);
      }
    }
    
    throw new Error('All CDN providers failed');
  }
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured
- [ ] SSL certificates active
- [ ] Cache rules defined
- [ ] Origin server headers set
- [ ] Asset optimization complete

### Post-Deployment
- [ ] Cache warming completed
- [ ] Performance metrics baseline
- [ ] Monitoring alerts configured
- [ ] Fallback tested
- [ ] Documentation updated

## Performance Results

### Expected Improvements
| Metric | Before CDN | After CDN | Improvement |
|--------|------------|-----------|-------------|
| Asset Load Time (US) | 500ms | 50ms | 90% |
| Asset Load Time (EU) | 1200ms | 60ms | 95% |
| Asset Load Time (Asia) | 2000ms | 80ms | 96% |
| Bandwidth Costs | $500/mo | $50/mo | 90% |
| Origin Load | 100% | 10% | 90% |

## Success Metrics
- [ ] Global asset latency < 100ms
- [ ] Cache hit rate > 95%
- [ ] Zero origin overload incidents
- [ ] 99.99% CDN uptime
- [ ] Bandwidth costs reduced by 80%+

---
*Priority: HIGH for global performance*