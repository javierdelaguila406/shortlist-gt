'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export function RobotBackground() {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 90, damping: 16 });
  const sy = useSpring(y, { stiffness: 90, damping: 16 });

  const rotateY = useTransform(sx, [0, 1], [-14, 14]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);
  const pupilaX = useTransform(sx, [0, 1], [-14, 14]);
  const pupilaY = useTransform(sy, [0, 1], [-10, 10]);

  useEffect(() => {
    const mover = (event: PointerEvent) => {
      x.set(event.clientX / window.innerWidth);
      y.set(event.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', mover);
    return () => window.removeEventListener('pointermove', mover);
  }, [x, y]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.22]">
      <motion.svg
        viewBox="0 0 400 400"
        className="h-[80vh] w-auto max-w-none"
        style={{ rotateX, rotateY, transformPerspective: 900 }}
      >
        <line x1="200" y1="40" x2="200" y2="80" strokeWidth="8" strokeLinecap="round" className="stroke-brand" />
        <circle cx="200" cy="34" r="12" className="fill-brand" />
        <rect x="90" y="80" width="220" height="200" rx="60" strokeWidth="8" className="fill-card stroke-brand" />
        <rect x="120" y="130" width="160" height="90" rx="40" strokeWidth="5" className="fill-background stroke-brand" />
        <motion.circle cx="165" cy="175" r="18" className="fill-brand" style={{ x: pupilaX, y: pupilaY }} />
        <motion.circle cx="235" cy="175" r="18" className="fill-brand" style={{ x: pupilaX, y: pupilaY }} />
        <rect x="160" y="230" width="80" height="12" rx="6" className="fill-brand/60" />
        <rect x="70" y="150" width="20" height="60" rx="8" className="fill-brand" />
        <rect x="310" y="150" width="20" height="60" rx="8" className="fill-brand" />
      </motion.svg>
    </div>
  );
}
