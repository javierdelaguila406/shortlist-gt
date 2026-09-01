'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, Phone, Mail, Calendar } from 'lucide-react';

interface Candidato {
  id: string;
  nombre: string;
  email?: string;
  telefono: string;
  score_total: number;
  estado: string;
  disponibilidad?: string;
  created_at: string;
}

interface CandidatosTableProps {
  candidatos: Candidato[];
  onSelectCandidato: (candidato: Candidato) => void;
  isLoading?: boolean;
}

export function CandidatosTable({
  candidatos,
  onSelectCandidato,
  isLoading,
}: CandidatosTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-800 rounded mb-4"></div>
              <div className="h-8 bg-zinc-800 rounded mb-4"></div>
              <div className="h-8 bg-zinc-800 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidatos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center">
          <p className="text-zinc-400 mb-4">No hay candidatos aún</p>
          <p className="text-sm text-zinc-500">Comparte el enlace de postulación para recibir candidatos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/40">
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Candidato
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Contacto
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Disponibilidad
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map((candidato) => (
              <tr
                key={candidato.id}
                className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-white">{candidato.nombre}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(candidato.created_at).toLocaleDateString('es-GT')}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    {candidato.email && (
                      <a
                        href={`mailto:${candidato.email}`}
                        className="text-zinc-400 hover:text-zinc-300 transition-colors"
                        title={candidato.email}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {candidato.telefono && (
                      <a
                        href={`https://wa.me/${candidato.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-300 transition-colors"
                        title={candidato.telefono}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                    <span className="text-sm font-bold text-emerald-400">
                      {Math.round(candidato.score_total)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {candidato.disponibilidad ? (
                    <Badge variant="success">{candidato.disponibilidad}</Badge>
                  ) : (
                    <span className="text-sm text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusVariant(candidato.estado)}>
                    {candidato.estado}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectCandidato(candidato)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getStatusVariant(
  estado: string
): 'default' | 'success' | 'warning' | 'destructive' | 'info' {
  switch (estado) {
    case 'aprobado':
      return 'success';
    case 'rechazado':
      return 'destructive';
    case 'en_revision':
      return 'warning';
    case 'oferta':
      return 'info';
    default:
      return 'default';
  }
}
