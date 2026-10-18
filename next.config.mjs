/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allows production builds to successfully complete even if
    // third-party packages (like @anon-aadhaar/core which exposes raw .ts files as types) have type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to succeed without failing on linter issues
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
