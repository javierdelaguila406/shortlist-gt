'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import dynamic from 'next/dynamic';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacanteTitle: string;
  candidates: any[];
  company?: string;
}

export function ProfessionalReportModal({ isOpen, onClose, vacanteTitle, candidates, company = 'FORNITURE CITY' }: ReportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [periodo, setPeriodo] = useState('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const generateProfessionalPDF = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const sorted = [...candidates].sort((a, b) => (b.score_ia || 0) - (a.score_ia || 0));
      const avgScore = Math.round(sorted.reduce((sum, c) => sum + (c.score_ia || 0), 0) / sorted.length || 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }

            .header {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              margin-bottom: 30px;
            }

            .logo-text { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; opacity: 0.9; }

            .company-info {
              background: #f5f5f5;
              padding: 20px 30px;
              border-left: 4px solid #22c55e;
              margin-bottom: 30px;
            }

            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { width: 150px; font-weight: 600; color: #666; }
            .info-value { flex: 1; color: #333; }

            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1f2937;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #22c55e;
              padding-bottom: 10px;
            }

            .metrics {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }

            .metric-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .metric-value {
              font-size: 32px;
              font-weight: 700;
              color: #22c55e;
              margin-bottom: 5px;
            }

            .metric-label {
              font-size: 12px;
              color: #666;
              font-weight: 600;
              text-transform: uppercase;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            thead {
              background: #1f2937;
              color: white;
            }

            th {
              padding: 15px;
              text-align: left;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            td {
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
            }

            tbody tr:hover {
              background: #f9fafb;
            }

            .rank-badge {
              background: #22c55e;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 600;
              min-width: 30px;
              text-align: center;
            }

            .score-high { color: #22c55e; font-weight: 700; }
            .score-medium { color: #f59e0b; font-weight: 700; }
            .score-low { color: #ef4444; font-weight: 700; }

            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #999;
              text-align: center;
            }

            .page-break { page-break-after: always; }

            @media print {
              body { margin: 0; padding: 0; }
              .header { margin-bottom: 20px; padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-text">SHORTLIST.GT</div>
            <div class="subtitle">Reporte Ejecutivo de Candidatos</div>
          </div>

          <div class="company-info">
            <div class="info-row">
              <div class="info-label">Empresa:</div>
              <div class="info-value">${company}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Vacante:</div>
              <div class="info-value">${vacanteTitle}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Generado:</div>
              <div class="info-value">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Total Candidatos:</div>
              <div class="info-value">${sorted.length}</div>
            </div>
          </div>

          <div class="section-title">📊 MÉTRICAS PRINCIPALES</div>
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-value">${sorted.length}</div>
              <div class="metric-label">Total</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${avgScore}</div>
              <div class="metric-label">Score Promedio</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${sorted.filter(c => c.estado === 'precalificado').length}</div>
              <div class="metric-label">Precalificados</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${sorted.filter(c => c.estado === 'evaluacion').length}</div>
              <div class="metric-label">En Evaluación</div>
            </div>
          </div>

          <div class="section-title">👥 CANDIDATOS CLASIFICADOS</div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">Rank</th>
                <th style="width: 25%">Nombre</th>
                <th style="width: 25%">Email</th>
                <th style="width: 15%">Teléfono</th>
                <th style="width: 12%">Score</th>
                <th style="width: 18%">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((candidate, idx) => `
                <tr>
                  <td><span class="rank-badge">${idx + 1}</span></td>
                  <td><strong>${candidate.nombre}</strong></td>
                  <td>${candidate.email}</td>
                  <td>${candidate.telefono}</td>
                  <td class="score-${candidate.score_ia > 80 ? 'high' : candidate.score_ia > 60 ? 'medium' : 'low'}">
                    ${candidate.score_ia || '-'}/100
                  </td>
                  <td>${candidate.estado.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Documento confidencial generado por SHORTLIST.GT © ${new Date().getFullYear()}</p>
            <p>Este reporte contiene información confidencial de procesos de selección.</p>
          </div>
        </body>
        </html>
      `;

      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const options: any = {
        margin: 10,
        filename: `Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      (html2pdf() as any).set(options).from(htmlContent).save();
    } catch (error) {
      console.error('Error:', error);
      alert('Error generando PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExcel = async () => {
    setIsExporting(true);
    try {
      const xlsx = await import('xlsx');
      const sorted = [...candidates].sort((a, b) => (b.score_ia || 0) - (a.score_ia || 0));
      const avgScore = Math.round(sorted.reduce((sum, c) => sum + (c.score_ia || 0), 0) / sorted.length || 0);

      const wb = xlsx.utils.book_new();

      const summary = [
        ['REPORTE EJECUTIVO DE CANDIDATOS'],
        ['SHORTLIST.GT'],
        [],
        [`Empresa: FORNITURE CITY`],
        [`Vacante: ${vacanteTitle}`],
        [`Generado: ${new Date().toLocaleDateString('es-ES')}`],
        [],
        ['MÉTRICAS PRINCIPALES'],
        ['Métrica', 'Valor'],
        ['Total de Candidatos', sorted.length],
        ['Score Promedio', avgScore],
        ['Precalificados', sorted.filter(c => c.estado === 'precalificado').length],
        ['En Evaluación', sorted.filter(c => c.estado === 'evaluacion').length],
      ];

      const ws1 = xlsx.utils.aoa_to_sheet(summary);
      ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
      ws1['A1'].s = { font: { bold: true, size: 16, color: { rgb: '22c55e' } } };
      xlsx.utils.book_append_sheet(wb, ws1, 'Resumen');

      const candidatesData = [['Rank', 'Nombre', 'Email', 'Teléfono', 'Score IA', 'Experiencia', 'Estado', 'Habilidades']];
      sorted.forEach((c, idx) => {
        candidatesData.push([
          idx + 1,
          c.nombre,
          c.email,
          c.telefono,
          c.score_ia || '-',
          c.experiencia_anos || '-',
          c.estado.toUpperCase(),
          (c.habilidades || []).join(', ')
        ]);
      });

      const ws2 = xlsx.utils.aoa_to_sheet(candidatesData);
      ws2['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 }
      ];
      xlsx.utils.book_append_sheet(wb, ws2, 'Candidatos');

      xlsx.writeFile(wb, `Reporte_${vacanteTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error generando Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exportar Reporte Profesional</CardTitle>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">Genera un reporte ejecutivo profesional para presentar a la empresa.</p>

          {/* Filtro de Período */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Período del Reporte</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPeriodo('hoy')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  periodo === 'hoy'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setPeriodo('semana')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  periodo === 'semana'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Últimos 7 días
              </button>
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  periodo === 'mes'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Este mes
              </button>
              <button
                onClick={() => setPeriodo('ano')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  periodo === 'ano'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Este año
              </button>
              <button
                onClick={() => setPeriodo('personalizado')}
                className={`col-span-2 px-3 py-2 rounded text-sm transition-colors ${
                  periodo === 'personalizado'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Personalizado
              </button>
            </div>

            {periodo === 'personalizado' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={generateProfessionalPDF}
              disabled={isExporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando PDF...' : 'Descargar PDF Profesional'}
            </button>

            <button
              onClick={generateExcel}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando Excel...' : 'Descargar Excel'}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-white"
            >
              Cancelar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
