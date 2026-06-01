/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
