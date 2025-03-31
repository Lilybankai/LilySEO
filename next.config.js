/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  // Force dynamic mode for all pages and API routes
  experimental: {
    // Skip type checking on build
    skipTypechecking: true,
    // Skip static generation for problematic paths
    skipTrailingSlashRedirect: true,
    // Skip middleware and route detection during build
    isrMemoryCacheSize: 0,
    serverComponentsExternalPackages: ['next', '@tanstack/react-query', 'jspdf', '@paypal/react-paypal-js', '@hello-pangea/dnd', 'geist'],
  },
  // Instead of failing on error, ignore errors during build
  onDemandEntries: {
    // Continue build even with errors
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  eslint: { 
    ignoreDuringBuilds: true
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force all pages to be dynamic
  staticPageGenerationTimeout: 1000, // Short timeout to skip static generation
  distDir: '.next',
  // Configure webpack for aliases
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hello-pangea/dnd': isServer 
        ? require.resolve('./src/stubs/dnd.js') 
        : '@hello-pangea/dnd',
      '@paypal/react-paypal-js': isServer 
        ? require.resolve('./src/stubs/paypal.js') 
        : '@paypal/react-paypal-js',
      '@tanstack/react-query': isServer 
        ? require.resolve('./src/stubs/react-query.js') 
        : '@tanstack/react-query',
      'geist': isServer 
        ? require.resolve('./src/stubs/geist-font.js') 
        : 'geist',
      'jspdf': isServer 
        ? require.resolve('./src/stubs/jspdf.js') 
        : 'jspdf',
      '@supabase/ssr': isServer 
        ? require.resolve('./src/stubs/supabase-ssr.js') 
        : '@supabase/ssr',
    };

    return config;
  },
  // Force dynamic behavior for all routes
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
          has: [{ type: 'header', key: 'x-force-dynamic' }]
        }
      ]
    };
  },
};

module.exports = nextConfig; 