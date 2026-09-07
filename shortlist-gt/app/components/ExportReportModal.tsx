'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacanteTitle: string;
  candidates: any[];
}

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type Format = 'pdf' | 'xlsx';

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

  const generatePDF = async () => {
    const filteredCandidates = filterCandidatesByPeriod();
    const [startDate, endDate] = getPeriodDates(selectedPeriod);
    const periodLabel = getPeriodLabel();

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94);
    doc.text('SHORTLIST.GT', 20, yPosition);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;
    doc.text(`Reporte: ${vacanteTitle}`, 20, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()} (${periodLabel})`, 20, yPosition);
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPosition + 5);

    yPosition += 20;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('MÉTRICAS', 20, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    const avgScore = filteredCandidates.length
      ? Math.round(filteredCandidates.reduce((sum, c) => sum + (c.score_ia || 0), 0) / filteredCandidates.length)
      : 0;

    const metrics = [
      `• Total de candidatos: ${filteredCandidates.length}`,
      `• Score promedio: ${avgScore}/100`,
      `• Precalificados: ${filteredCandidates.filter(c => c.estado === 'precalificado').length}`,
      `• En evaluación: ${filteredCandidates.filter(c => c.estado === 'evaluacion').length}`
    ];

    metrics.forEach(metric => {
      doc.text(metric, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
    doc.setFontSize(12);
    doc.text('TOP CANDIDATOS', 20, yPosition);
    yPosition += 8;

    const sorted = [...filteredCandidates].sort((a, b) => (b.score_ia || 0) - (a.score_ia || 0)).slice(0, 5);

    sorted.forEach((candidate, index) => {
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text(`${index + 1}. ${candidate.nombre}`, 20, yPosition);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      yPosition += 5;
      doc.text(`   Email: ${candidate.email}`, 20, yPosition);
      yPosition += 4;
      doc.text(`   Teléfono: ${candidate.telefono}`, 20, yPosition);
      yPosition += 4;
      doc.text(`   Score: ${candidate.score_ia || 0}/100 | Estado: ${candidate.estado}`, 20, yPosition);
      yPosition += 4;
      doc.text(`   Experiencia: ${candidate.experiencia_anos} años`, 20, yPosition);
      yPosition += 6;

      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Reporte generado automáticamente por SHORTLIST.GT', 20, yPosition);

    doc.save(`Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${startDate.toISOString().split('T')[0]}.pdf`);
  };

  const generateExcel = async () => {
    const xlsx = await import('xlsx');
    const filteredCandidates = filterCandidatesByPeriod();
    const [startDate, endDate] = getPeriodDates(selectedPeriod);
    const periodLabel = getPeriodLabel();

    const wb = xlsx.utils.book_new();

    // Sheet 1: Resumen
    const summary = [
      ['SHORTLIST.GT - REPORTE EJECUTIVO'],
      [],
      [`Vacante: ${vacanteTitle}`],
      [`Período: ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`],
      [`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
      [],
      ['MÉTRICAS'],
      ['Total de candidatos', filteredCandidates.length],
      ['Precalificados', filteredCandidates.filter(c => c.estado === 'precalificado').length],
      ['En evaluación', filteredCandidates.filter(c => c.estado === 'evaluacion').length],
      ['Score promedio', Math.round(filteredCandidates.reduce((sum, c) => sum + (c.score_ia || 0), 0) / filteredCandidates.length || 0)]
    ];

    const ws1 = xlsx.utils.aoa_to_sheet(summary);
    ws1['!cols'] = [{ wch: 30 }, { wch: 15 }];
    xlsx.utils.book_append_sheet(wb, ws1, 'Resumen');

    // Sheet 2: Candidatos
    const candidates_data = [
      ['Nombre', 'Email', 'Teléfono', 'Score IA', 'Experiencia (años)', 'Estado', 'Habilidades']
    ];

    [...filteredCandidates]
      .sort((a, b) => (b.score_ia || 0) - (a.score_ia || 0))
      .forEach(c => {
        candidates_data.push([
          c.nombre,
          c.email,
          c.telefono,
          c.score_ia || '-',
          c.experiencia_anos || '-',
          c.estado,
          (c.habilidades || []).join(', ')
        ]);
      });

    const ws2 = xlsx.utils.aoa_to_sheet(candidates_data);
    ws2['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 }
    ];
    xlsx.utils.book_append_sheet(wb, ws2, 'Candidatos');

    xlsx.writeFile(wb, `Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${startDate.toISOString().split('T')[0]}.xlsx`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'pdf') {
        await generatePDF();
      } else {
        await generateExcel();
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar reporte. Intenta de nuevo.');
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
                { id: 'pdf', label: '📄 PDF Profesional' },
                { id: 'xlsx', label: '📊 Excel/XLSX' },
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
              onClick={handleExport}
              disabled={isExporting || (selectedPeriod === 'custom' && (!customStartDate || !customEndDate))}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando...' : 'Descargar'}
            </Button>
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
