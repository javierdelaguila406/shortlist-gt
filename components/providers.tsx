'use client';

import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster position="top-center" richColors closeButton />
    </MotionConfig>
  );
}
