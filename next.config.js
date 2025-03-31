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
      '@tanstack/react-query': path.resolve(__dirname, './src/stubs/react-query.js'),
      '@hello-pangea/dnd': path.resolve(__dirname, './src/stubs/dnd.js'),
      '@paypal/react-paypal-js': path.resolve(__dirname, './src/stubs/paypal.js'),
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
};

module.exports = nextConfig; 