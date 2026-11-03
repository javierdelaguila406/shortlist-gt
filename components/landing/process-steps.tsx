'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const pasos = [
  { titulo: 'Crear la vacante', texto: 'Describe el puesto y obtén un enlace propio para postularse.' },
  { titulo: 'Compartir el enlace', texto: 'Publícalo donde quieras: correo, redes o WhatsApp.' },
  { titulo: 'Recibir postulaciones', texto: 'Cada CV llega con su puntaje de ajuste a la plaza.' },
  { titulo: 'Evaluar', texto: 'Envía una evaluación con enlace personal, de uso único y con vencimiento.' },
  { titulo: 'Decidir y reportar', texto: 'Revisa el expediente y descarga el reporte para gerencia.' },
];

export function ProcessSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 40%'] });
  const linea = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative mx-auto flex max-w-xl flex-col gap-8 pl-10">
      <div className="absolute bottom-2 left-3 top-2 w-px bg-border" aria-hidden="true" />
      <motion.div
        className="absolute left-3 top-2 w-px origin-top bg-brand"
        style={{ scaleY: linea, bottom: '0.5rem' }}
        aria-hidden="true"
      />
      {pasos.map((paso, i) => (
        <motion.div
          key={paso.titulo}
          className="relative"
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute -left-10 top-0.5 grid size-6 place-items-center rounded-full border bg-background text-xs font-semibold">
            {i + 1}
          </span>
          <p className="font-semibold">{paso.titulo}</p>
          <p className="text-sm text-muted-foreground text-pretty">{paso.texto}</p>
        </motion.div>
      ))}
    </div>
  );
}
