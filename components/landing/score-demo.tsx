'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const candidatos = [
  { nombre: 'Marta López', puesto: 'Ejecutiva comercial', ajuste: 69, habilidades: ['Ventas', 'Atención'] },
  { nombre: 'Ana Morales', puesto: 'Ejecutiva comercial', ajuste: 84, habilidades: ['Ventas', 'CRM'] },
  { nombre: 'Luis Castillo', puesto: 'Ejecutivo comercial', ajuste: 77, habilidades: ['Negociación', 'Ventas'] },
];

const orden = [...candidatos].sort((a, b) => b.ajuste - a.ajuste);

function Contador({ valor, active }: { valor: number; active: boolean }) {
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    if (!active) return;
    const controls = animate(0, valor, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setMostrado(Math.round(v)),
    });
    return () => controls.stop();
  }, [active, valor]);

  return <span className="tabular-nums">{mostrado}%</span>;
}

export function ScoreDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const enPantalla = useInView(ref, { once: true, amount: 0.4 });
  const [ordenado, setOrdenado] = useState(false);

  useEffect(() => {
    if (!enPantalla) return;
    const timer = setTimeout(() => setOrdenado(true), 1400);
    return () => clearTimeout(timer);
  }, [enPantalla]);

  const lista = ordenado ? orden : candidatos;

  return (
    <div ref={ref} className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Ejemplo: ajuste a la plaza
      </p>
      {lista.map((c) => (
        <motion.div key={c.nombre} layout transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <Card className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">{c.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{c.puesto}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.habilidades.map((h) => (
                  <Badge key={h}>{h}</Badge>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-semibold">
                <Contador valor={c.ajuste} active={enPantalla} />
              </p>
              <p className="text-xs text-muted-foreground">ajuste</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
