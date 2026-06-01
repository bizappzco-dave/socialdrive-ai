/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nmebpawvnhrokouksvir.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
