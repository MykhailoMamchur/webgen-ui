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
  // Ensure streaming works in production
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable compression for streaming responses
  compress: false,
  // Add custom headers to prevent buffering
  async headers() {
    return [
      {
        source: '/api/edit',
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
