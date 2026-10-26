import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nuvora - Plataforma de reclutamiento',
    short_name: 'Nuvora',
    description: 'Plataforma de reclutamiento inteligente',
    start_url: '/dashboard/reclutador',
    scope: '/',
    display: 'standalone',
    background_color: '#1c1f25',
    theme_color: '#1c1f25',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
