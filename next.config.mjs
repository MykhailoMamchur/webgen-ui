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
  
  // Force static generation to be disabled for API routes
  trailingSlash: false,
  
  // Experimental features for better streaming support
  experimental: {
    serverComponentsExternalPackages: [],
    // Enable streaming in production
    appDir: true,
  },
  
  // Custom headers - make sure these apply globally
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  
  // Disable static optimization for API routes
  async rewrites() {
    return []
  },
};

export default nextConfig;