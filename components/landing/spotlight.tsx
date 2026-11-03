'use client';

import { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';

export function Spotlight() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  useEffect(() => {
    const mover = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener('pointermove', mover);
    return () => window.removeEventListener('pointermove', mover);
  }, [x, y]);

  const fondo = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, color-mix(in oklab, var(--brand) 12%, transparent), transparent 70%)`;

  return <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" style={{ background: fondo }} />;
}
