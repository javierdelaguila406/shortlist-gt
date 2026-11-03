'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0.5);
  const posY = useMotionValue(0.5);

  const rotateY = useSpring(useTransform(posX, [0, 1], [-5, 5]), { stiffness: 200, damping: 22 });
  const rotateX = useSpring(useTransform(posY, [0, 1], [5, -5]), { stiffness: 200, damping: 22 });

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
      className="group h-full"
    >
      <Card className={cn('flex h-full flex-col gap-4 transition-shadow duration-300 hover:border-foreground/15 hover:shadow-md', className)}>
        {children}
      </Card>
    </motion.div>
  );
}
