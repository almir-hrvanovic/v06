# Next.js Configuration Guide

## Current Version: Next.js 15.4.4

This guide provides the correct configuration patterns for Next.js 15.4.4, addressing all deprecations and best practices.

## 📋 Configuration Files Overview

### 1. next.config.ts
The main configuration file for Next.js applications.

```typescript
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // Build Output
  output: 'standalone', // Options: 'standalone' | 'export'
  
  // React Configuration
  reactStrictMode: true, // Recommended for all apps
  
  // Environment Variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  },
  
  // Image Optimization (Next.js 15+ syntax)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Optional: Image configuration
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  
  // TypeScript Configuration
  typescript: {
    ignoreBuildErrors: false, // Always type-check in build
  },
  
  // ESLint Configuration
  eslint: {
    ignoreDuringBuilds: false, // Always lint in build
    dirs: ['src'], // Directories to lint
  },
  
  // Experimental Features (Next.js 15.4.4)
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-*',
      'lucide-react',
    ],
    // serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Headers
  async headers() {
    return isProduction ? [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ] : []
  },
  
  // Webpack Configuration
  webpack: (config, { isServer, dev }) => {
    // Custom webpack config
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // Performance
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}

// Apply plugins
const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
```

### 2. tsconfig.json
TypeScript configuration for Next.js apps.

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    
    // Modules
    "module": "esnext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    
    // JavaScript Support
    "allowJs": true,
    "checkJs": false,
    
    // Emit
    "noEmit": true,
    "incremental": true,
    
    // Interop Constraints
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    
    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Skip Lib Check
    "skipLibCheck": true,
    
    // Plugins
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
```

### 3. .eslintrc.json
ESLint configuration for Next.js apps.

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    // React Rules
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn",
    
    // Next.js Rules
    "@next/next/no-html-link-for-pages": "off",
    
    // TypeScript Rules (if using TypeScript ESLint)
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    
    // General Rules
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error"
  },
  "ignorePatterns": [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "*.config.js"
  ]
}
```

## 🚨 Common Deprecations in Next.js 15

### ❌ Deprecated Patterns

1. **Image domains**
```typescript
// ❌ OLD (deprecated)
images: {
  domains: ['example.com']
}

// ✅ NEW
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'example.com'
    }
  ]
}
```

2. **Dev Indicators**
```typescript
// ❌ OLD (deprecated)
devIndicators: {
  buildActivity: true,
  buildActivityPosition: 'bottom-right'
}

// ✅ NEW - Remove completely, handled automatically
```

3. **Experimental Features Now Stable**
```typescript
// ❌ OLD
experimental: {
  appDir: true, // Now default
  serverActions: true, // Now stable
}

// ✅ NEW - Remove stable features
experimental: {
  optimizePackageImports: ['package-name']
}
```

## 📚 Additional Resources

### Environment Variables
```typescript
// Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com

// Server-only variables
DATABASE_URL=postgresql://...
SECRET_KEY=...
```

### Middleware Configuration
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Turbopack (Stable in Next.js 15)
```typescript
// Use --turbo flag for faster development
// npm run dev --turbo
```

## 🎯 Best Practices

1. **Always use TypeScript** with strict mode enabled
2. **Enable all linting** during builds
3. **Use remotePatterns** for images, not domains
4. **Keep experimental features minimal**
5. **Use standalone output** for containerized deployments
6. **Enable React Strict Mode** for better debugging
7. **Configure proper security headers** for production

## 🔧 Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run type-check`
- Check ESLint errors: `npm run lint`
- Clear cache: `rm -rf .next`

### Configuration Not Applied
- Restart dev server after config changes
- Check for typos in configuration keys
- Ensure proper TypeScript types are imported

### Performance Issues
- Enable Turbopack: `npm run dev --turbo`
- Check bundle size: `npm run build && npm run analyze`
- Use `optimizePackageImports` for large dependencies