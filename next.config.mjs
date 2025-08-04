/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*.vercel.app', 'localhost:3000']
    }
  },
  typescript: {
    // Allow production builds to complete even if there are type errors
    ignoreBuildErrors: false
  },
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: false
  }
};

export default nextConfig;