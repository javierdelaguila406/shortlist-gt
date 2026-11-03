'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export function LogoScanner() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 80, damping: 12, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 80, damping: 12, mass: 0.8 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-24, 24]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [20, -20]);
  const desplazaX = useTransform(sx, [-0.5, 0.5], [-40, 40]);
  const desplazaY = useTransform(sy, [-0.5, 0.5], [-28, 28]);

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
      animate={{ scale: escaneando ? 1.12 : 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      className={`mx-auto grid size-28 place-items-center rounded-[28%] bg-brand text-brand-foreground transition-shadow duration-300 sm:size-36 ${
        escaneando ? 'shadow-[0_0_48px_color-mix(in_oklab,var(--brand)_50%,transparent)]' : 'shadow-sm'
      }`}
    >
      <span className="text-6xl font-bold leading-none sm:text-7xl">N</span>
    </motion.div>
  );
}
