'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/landing/tilt-card';

const contenedor = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const elemento = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function EnlaceSimulado() {
  const [hover, setHover] = useState(false);
  return (
    <div
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-dashed p-3 text-xs"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={hover ? 'uso' : 'enlace'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={hover ? 'text-brand' : 'truncate text-muted-foreground'}
        >
          {hover ? 'Uso único · vence en 7 días' : 'nuvoragt.com/evaluacion/x7K2…'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function Bento() {
  return (
    <motion.div
      variants={contenedor}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
    >
      <motion.div variants={elemento} className="md:col-span-2">
        <TiltCard>
          <div>
            <CardTitle className="text-lg">Contrata más rápido</CardTitle>
            <CardDescription>Crea una vacante en minutos y comparte su enlace donde quieras.</CardDescription>
          </div>
          <div className="mt-auto flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">Activa</span>
            <span className="truncate text-muted-foreground">Ejecutivo comercial · enlace listo para compartir</span>
          </div>
        </TiltCard>
      </motion.div>

      <motion.div variants={elemento}>
        <TiltCard>
          <div>
            <CardTitle className="text-lg">Ordena lo que importa</CardTitle>
            <CardDescription>Cada CV llega con un puntaje de ajuste a la plaza.</CardDescription>
          </div>
          <div className="mt-auto space-y-2">
            <div className="flex justify-between text-xs">
              <span>Ana Morales</span>
              <span className="tabular-nums">84%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted transition-shadow duration-300 group-hover:shadow-[0_0_12px_color-mix(in_oklab,var(--brand)_55%,transparent)]">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                whileInView={{ width: '84%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </TiltCard>
      </motion.div>

      <motion.div variants={elemento}>
        <TiltCard>
          <div>
            <CardTitle className="text-lg">Evalúa sin correos</CardTitle>
            <CardDescription>Cada candidato recibe un enlace personal que vence en 7 días.</CardDescription>
          </div>
          <EnlaceSimulado />
        </TiltCard>
      </motion.div>

      <motion.div variants={elemento}>
        <TiltCard>
          <div>
            <CardTitle className="text-lg">Todo en un solo lugar</CardTitle>
            <CardDescription>Expediente, CV y resultados de cada persona, siempre a la mano.</CardDescription>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            <Badge>CV</Badge>
            <Badge>Puntajes</Badge>
            <Badge>Resumen</Badge>
          </div>
        </TiltCard>
      </motion.div>

      <motion.div variants={elemento} className="md:col-span-3">
        <TiltCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-lg">Reportes listos para gerencia</CardTitle>
              <CardDescription>Descarga PDF o Excel en un clic.</CardDescription>
            </div>
            <div className="flex gap-2">
              <motion.span
                whileHover={{ y: -2, boxShadow: '0 8px 18px -10px rgba(0,0,0,0.5)' }}
                transition={{ duration: 0.2 }}
                className="cursor-default rounded-lg border bg-card px-4 py-2 text-sm font-medium"
              >
                PDF
              </motion.span>
              <motion.span
                whileHover={{ y: -2, boxShadow: '0 8px 18px -10px rgba(0,0,0,0.5)' }}
                transition={{ duration: 0.2 }}
                className="cursor-default rounded-lg border bg-card px-4 py-2 text-sm font-medium"
              >
                Excel
              </motion.span>
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </motion.div>
  );
}
