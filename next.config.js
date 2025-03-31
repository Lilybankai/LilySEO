/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config) => {
    // Add alias for problematic packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hello-pangea/dnd': path.resolve(__dirname, './src/stubs/dnd.js'),
      '@paypal/react-paypal-js': path.resolve(__dirname, './src/stubs/paypal.js'),
      '@tanstack/react-query': path.resolve(__dirname, './src/stubs/react-query.js'),
      '@supabase/ssr': path.resolve(__dirname, './src/stubs/supabase-ssr.js'),
      'jspdf': path.resolve(__dirname, './src/stubs/jspdf.js'),
      'axios': path.resolve(__dirname, './src/stubs/axios.js'),
      '@upstash/redis': path.resolve(__dirname, './src/stubs/upstash-redis.js'),
      'geist/font/sans': path.resolve(__dirname, './src/stubs/geist-font.js'),
      'geist/font': path.resolve(__dirname, './src/stubs/geist-font.js'),
    };
    
    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com', 'progitek.no', 'lh3.googleusercontent.com']
  }
};

module.exports = nextConfig; 