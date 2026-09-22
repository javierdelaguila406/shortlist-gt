import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'fs': 'empty',
        'path': 'empty',
        'crypto': 'empty',
        '@nodelib/fs.scandir': 'empty',
        '@nodelib/fs.stat': 'empty',
        '@nodelib/fs.walk': 'empty',
        'fast-glob': 'empty',
        'tailwindcss': 'empty',
      };
    }
    return config;
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Habilitar XSS protection en navegadores antiguos
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Note: Content Security Policy is configured in middleware.ts for dynamic environment-based settings
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
