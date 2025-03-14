/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // Add any webpack configurations if needed
    return config;
  },
};

module.exports = nextConfig; 