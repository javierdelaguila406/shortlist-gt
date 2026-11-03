'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0.5);
  const posY = useMotionValue(0.5);

  const rotateY = useSpring(useTransform(posX, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const rotateX = useSpring(useTransform(posY, [0, 1], [5, -5]), { stiffness: 200, damping: 22 });

  const capaX = useSpring(useTransform(posX, [0, 1], [-10, 10]), { stiffness: 180, damping: 20 });
  const capaY = useSpring(useTransform(posY, [0, 1], [-8, 8]), { stiffness: 180, damping: 20 });

  const brilloX = useTransform(posX, (v) => `${v * 100}%`);
  const brilloY = useTransform(posY, (v) => `${v * 100}%`);
  const brillo = useMotionTemplate`radial-gradient(260px circle at ${brilloX} ${brilloY}, color-mix(in oklab, var(--brand) 14%, transparent), transparent 70%)`;

  function mover(event: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    posX.set((event.clientX - rect.left) / rect.width);
    posY.set((event.clientY - rect.top) / rect.height);
  }

  function reiniciar() {
    posX.set(0.5);
    posY.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={mover}
      onPointerLeave={reiniciar}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative h-full"
    >
      <Card className={cn('relative flex h-full flex-col gap-4 overflow-hidden transition-shadow duration-300 hover:border-foreground/15 hover:shadow-md', className)}>
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: brillo }} />
        <motion.div style={{ x: capaX, y: capaY }} className="relative flex h-full flex-col gap-4">
          {children}
        </motion.div>
      </Card>
    </motion.div>
  );
}
