/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable, no need for experimental flag
  // Note: i18n routing is handled differently in App Router
  // See: https://nextjs.org/docs/app/building-your-application/routing/internationalization
  
  // Vercel optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'obqpyhyjoaoaosfrgxfo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Ignore TypeScript errors during build (for development)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Ignore ESLint errors during build (TODO: fix these later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
}

export default nextConfig
