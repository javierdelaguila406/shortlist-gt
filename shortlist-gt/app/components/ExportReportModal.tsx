'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacanteTitle: string;
  candidates: any[];
}

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type Format = 'pdf' | 'csv';

export function ExportReportModal({ isOpen, onClose, vacanteTitle, candidates }: ExportReportModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [selectedFormat, setSelectedFormat] = useState<Format>('pdf');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const getPeriodDates = (period: Period): [Date, Date] => {
    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        return [new Date(today.setHours(0, 0, 0, 0)), new Date(today.setHours(23, 59, 59, 999))];
      case 'week':
        startDate.setDate(today.getDate() - 7);
        return [startDate, new Date()];
      case 'month':
        startDate.setDate(today.getDate() - 30);
        return [startDate, new Date()];
      case 'year':
        startDate.setFullYear(today.getFullYear(), 0, 1);
        return [startDate, new Date(today.getFullYear(), 11, 31)];
      case 'custom':
        return [new Date(customStartDate), new Date(customEndDate)];
      default:
        return [startDate, new Date()];
    }
  };

  const filterCandidatesByPeriod = (): any[] => {
    if (selectedPeriod === 'custom' && (!customStartDate || !customEndDate)) {
      return candidates;
    }

    const [startDate, endDate] = getPeriodDates(selectedPeriod);
    return candidates.filter(c => {
      const createdDate = new Date(c.fecha_aplicacion || new Date());
      return createdDate >= startDate && createdDate <= endDate;
    });
  };

  const generateReport = async () => {
    setIsExporting(true);
    const filteredCandidates = filterCandidatesByPeriod();
    const [startDate, endDate] = getPeriodDates(selectedPeriod);
    const periodLabel = getPeriodLabel();

    try {
      if (selectedFormat === 'pdf') {
        // Simulate PDF generation
        const reportContent = `
REPORTE: ${vacanteTitle}
Período: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()} - ${periodLabel}
Fecha de generación: ${new Date().toLocaleDateString()}

MÉTRICAS:
- Total de candidatos: ${filteredCandidates.length}
- Score promedio: ${
          filteredCandidates.length
            ? Math.round(
                filteredCandidates.reduce((sum, c) => sum + (c.score_total || c.score_cv || 0), 0) /
                  filteredCandidates.length
              )
            : 0
        }
- Precalificados: ${filteredCandidates.filter(c => c.estado === 'precalificado').length}
- En evaluación: ${filteredCandidates.filter(c => c.estado === 'evaluacion').length}

TOP CANDIDATOS:
${filteredCandidates
  .sort((a, b) => (b.score_total || b.score_cv || 0) - (a.score_total || a.score_cv || 0))
  .slice(0, 5)
  .map(
    (c, i) => `
${i + 1}. ${c.nombre}
   Email: ${c.email}
   Score: ${c.score_total || c.score_cv || c.score_ia || 0}
   Estado: ${c.estado}
`
  )
  .join('')}

---
Reporte generado automáticamente por SHORTLIST.GT
        `;

        const blob = new Blob([reportContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${startDate.toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Generate CSV
        const headers = ['Nombre', 'Email', 'Teléfono', 'Score CV', 'Score Video', 'Score Test', 'Score Total', 'Estado'];
        const rows = filteredCandidates.map(c => [
          c.nombre,
          c.email,
          c.telefono,
          c.score_cv || '-',
          c.score_video || '-',
          c.score_test || '-',
          c.score_total || c.score_ia || '-',
          c.estado,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${startDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'today':
        return 'Diario';
      case 'week':
        return 'Semanal';
      case 'month':
        return 'Mensual';
      case 'year':
        return 'Anual';
      case 'custom':
        return 'Rango Personalizado';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exportar Informe</CardTitle>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Período:</label>
            <div className="space-y-2">
              {[
                { id: 'today', label: '📅 Hoy (Diario)' },
                { id: 'week', label: '📊 Últimos 7 días (Semanal)' },
                { id: 'month', label: '📈 Últimos 30 días (Mensual)' },
                { id: 'year', label: '📊 Este Año (Anual)' },
                { id: 'custom', label: '🗓️ Rango Personalizado' },
              ].map(period => (
                <label key={period.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value={period.id}
                    checked={selectedPeriod === period.id}
                    onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-zinc-300">{period.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fecha Inicio:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fecha Fin:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Formato:</label>
            <div className="space-y-2">
              {[
                { id: 'pdf', label: '📄 PDF Ejecutivo' },
                { id: 'csv', label: '📊 Excel/CSV' },
              ].map(format => (
                <label key={format.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => setSelectedFormat(e.target.value as Format)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-zinc-300">{format.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={generateReport}
              disabled={isExporting || (selectedPeriod === 'custom' && (!customStartDate || !customEndDate))}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando...' : 'Descargar'}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
