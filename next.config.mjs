/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Critical: Disable compression globally for streaming
  compress: false,
  
  // Disable static optimization for API routes
  async rewrites() {
    return []
  },
};

export default nextConfig;