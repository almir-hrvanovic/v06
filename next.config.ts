import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Output configuration
  output: 'standalone',
  
  // Environment variables validation
  env: {
    // Ensure required variables are set
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL!,
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', '@radix-ui/react-*', 'lucide-react'],
    optimizeCss: true, // Enable CSS optimization to reduce font loading issues
    // serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // Turbopack configuration (now stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'uploadthing.com',
      'utfs.io', // UploadThing CDN
      ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : []),
    ],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  
  // Security headers
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
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ] : [];
  },
  
  // Redirects
  async redirects() {
    return [];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Ignore certain warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
    ];
    
    // Development-specific configurations
    if (isDevelopment) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Production optimizations
    if (isProduction) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Dev indicators configuration
  devIndicators: {
    position: 'bottom-right',
  },
  
  // React strict mode
  reactStrictMode: true,
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);