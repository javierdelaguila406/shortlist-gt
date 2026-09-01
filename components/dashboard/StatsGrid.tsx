'use client';

import { AnalyticCard } from './AnalyticCard';
import { Users, MessageSquare, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';

interface StatsGridProps {
  totalCandidatos: number;
  totalVacantes: number;
  enWhatsApp: number;
  aprobados: number;
  tiempoPromedio: number;
  tasaConversion: number;
}

export function StatsGrid({
  totalCandidatos,
  totalVacantes,
  enWhatsApp,
  aprobados,
  tiempoPromedio,
  tasaConversion,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnalyticCard
        title="Candidatos Totales"
        value={totalCandidatos}
        subtitle="Postulaciones recibidas"
        icon={<Users className="w-5 h-5" />}
        trend={12}
        trendLabel="vs última semana"
      />

      <AnalyticCard
        title="En WhatsApp"
        value={enWhatsApp}
        subtitle="Evaluando activamente"
        icon={<MessageSquare className="w-5 h-5" />}
        trend={25}
        trendLabel="vs última semana"
      />

      <AnalyticCard
        title="Aprobados"
        value={aprobados}
        subtitle="Listos para entrevista"
        icon={<CheckCircle className="w-5 h-5" />}
        trend={8}
        trendLabel="vs última semana"
      />

      <AnalyticCard
        title="Vacantes Activas"
        value={totalVacantes}
        subtitle="Búsquedas en curso"
        icon={<Award className="w-5 h-5" />}
      />

      <AnalyticCard
        title="Tiempo Promedio"
        value={`${tiempoPromedio}d`}
        subtitle="Para encontrar candidato"
        icon={<Clock className="w-5 h-5" />}
        trend={-15}
        trendLabel="Mejora"
      />

      <AnalyticCard
        title="Tasa de Conversión"
        value={`${tasaConversion}%`}
        subtitle="Candidatos → Oferta"
        icon={<TrendingUp className="w-5 h-5" />}
        trend={22}
        trendLabel="vs mes anterior"
      />
    </div>
  );
}
