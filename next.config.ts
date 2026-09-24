import type { NextConfig } from "next";

// ========== BUILD-TIME VALIDATION ==========
// Validate NODE_ENV is set correctly before build
const nodeEnv = process.env.NODE_ENV;
if (!nodeEnv || !['production', 'development', 'test'].includes(nodeEnv)) {
  console.warn(`⚠️  WARNING: NODE_ENV="${nodeEnv}" is invalid. Expected: production, development, or test`);
  console.warn('   Current build CSP configuration may not be appropriate for the deployment target');
}

if (nodeEnv === 'production') {
  console.log('✓ Building for PRODUCTION: Restrictive CSP, no unsafe-* directives');
} else if (nodeEnv === 'development') {
  console.log('✓ Building for DEVELOPMENT: Permissive CSP for HMR');
}

const nextConfig: NextConfig = {
  // pdf-parse depende del binario nativo de @napi-rs/canvas; si webpack lo empaqueta, en Vercel falta y
  // /api/cv falla al cargar con "DOMMatrix is not defined".
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  // Use webpack instead of Turbopack due to custom webpack configuration
  // TODO: Migrate webpack config to Turbopack if possible
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
