/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true, // Enable Brotli/Gzip compression automatically for all text responses
  images: {
    formats: ['image/avif', 'image/webp'], // Deliver optimized AVIF/WebP image payloads
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200],
  },
};

export default nextConfig;
