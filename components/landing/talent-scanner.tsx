'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export function TalentScanner() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 18 });
  const sy = useSpring(y, { stiffness: 120, damping: 18 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [18, -18]);
  const desplazaX = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const desplazaY = useTransform(sy, [-0.5, 0.5], [-14, 14]);

  const [escaneando, setEscaneando] = useState(false);

  useEffect(() => {
    const mover = (event: PointerEvent) => {
      x.set(event.clientX / window.innerWidth - 0.5);
      y.set(event.clientY / window.innerHeight - 0.5);
      const objetivo = (event.target as HTMLElement | null)?.closest('[data-scan]');
      setEscaneando(Boolean(objetivo));
    };
    window.addEventListener('pointermove', mover);
    return () => window.removeEventListener('pointermove', mover);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ rotateX, rotateY, x: desplazaX, y: desplazaY, transformPerspective: 700 }}
      animate={{ scale: escaneando ? 1.08 : 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto size-28 sm:size-36"
    >
      <svg viewBox="0 0 200 200" className="size-full overflow-visible">
        <circle cx="85" cy="85" r="58" className={escaneando ? 'fill-brand/25 transition-colors duration-300' : 'fill-brand/10 transition-colors duration-300'} />
        <circle cx="85" cy="85" r="58" fill="none" strokeWidth="10" className="stroke-brand" />
        <path d="M 52 70 A 40 40 0 0 1 80 48" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-brand/60" />
        <line x1="128" y1="128" x2="180" y2="180" strokeWidth="18" strokeLinecap="round" className="stroke-foreground/70" />
      </svg>
    </motion.div>
  );
}
