'use client';

import { useState } from 'react';
import { Download, FileJson, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExportReportsProps {
  vacanteName: string;
  candidatosCount: number;
  aprobadosCount: number;
  rechazadosCount: number;
}

export function ExportReports({
  vacanteName,
  candidatosCount,
  aprobadosCount,
  rechazadosCount,
}: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToJSON = () => {
    setIsExporting(true);
    const data = {
      vacante: vacanteName,
      fecha: new Date().toISOString(),
      candidatos: {
        total: candidatosCount,
        aprobados: aprobadosCount,
        rechazados: rechazadosCount,
      },
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vacanteName}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    const csv = `Reporte de Vacante: ${vacanteName}
Fecha: ${new Date().toLocaleDateString('es-GT')}

Resumen
Total de Candidatos: ${candidatosCount}
Aprobados: ${aprobadosCount}
Rechazados: ${rechazadosCount}
Tasa de Aprobación: ${((aprobadosCount / candidatosCount) * 100).toFixed(2)}%
`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vacanteName}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Exportar Reportes
        </CardTitle>
        <CardDescription>
          Descarga un reporte de los candidatos de esta vacante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={exportToJSON}
            disabled={isExporting}
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
          <Button
            variant="secondary"
            className="flex items-center justify-center gap-2"
            onClick={exportToCSV}
            disabled={isExporting}
          >
            <FileText className="w-4 h-4" />
            CSV
          </Button>
        </div>

        <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg text-xs text-zinc-400">
          <p>
            <strong>Total:</strong> {candidatosCount} | <strong>Aprobados:</strong>{' '}
            {aprobadosCount} | <strong>Rechazados:</strong> {rechazadosCount}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
