/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts', expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-static' },
    },
    {
      // Cache the issuer public key endpoint for offline VC verification
      urlPattern: /\/api\/public-key/i,
      handler: 'CacheFirst',
      options: { cacheName: 'voltpass-keys', expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 } },
    },
  ],
});

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_ISSUER_PUBLIC_KEY: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? '',
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

module.exports = withPWA(nextConfig);
