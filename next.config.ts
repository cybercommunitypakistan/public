// FILE: next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // uploads from the admin panel (logo, team photos) are served by Cloudinary
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@gsap/react', 'gsap', 'lenis'],
  },
};

export default nextConfig;
