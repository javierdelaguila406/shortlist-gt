import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { getPostulationPath } from '@/lib/ui';

const read = (path: string) => readFileSync(path, 'utf8');

describe('enlaces de vacantes', () => {
  test('siempre deriva el enlace desde un ID estable', () => {
    expect(getPostulationPath('vacante-123')).toBe('/postular/vacante-123');
    expect(getPostulationPath('id con espacio')).toBe('/postular/id%20con%20espacio');
    expect(() => getPostulationPath('')).toThrow('Vacancy ID is required');
  });
});

describe('estados y accesibilidad básica', () => {
  test('páginas críticas exponen estados explícitos', () => {
    const dashboard = read('app/dashboard/reclutador/page.tsx');
    const application = read('app/postular/[slug]/page.tsx');
    expect(dashboard).toContain('Cargando vacantes...');
    expect(dashboard).toContain('No hay vacantes disponibles');
    expect(dashboard).toContain('Reintentar');
    expect(application).toContain('Cargando vacante...');
    expect(application).toContain('Vacante no encontrada');
    expect(application).toContain('Esta vacante cerró');
  });

  test('modales tienen rol, cierre con Escape y foco inicial', () => {
    for (const path of ['components/ExportReportModal.tsx', 'components/ProfessionalReportModal.tsx']) {
      const source = read(path);
      expect(source).toContain('role="dialog"');
      expect(source).toContain('aria-modal="true"');
      expect(source).toContain("event.key === 'Escape'");
      expect(source).toContain('.focus()');
      expect(source).toContain('aria-label="Cerrar');
    }
  });

  test('formulario de postulación asocia labels e inputs', () => {
    const source = read('app/postular/[slug]/page.tsx');
    for (const id of ['candidate-name', 'candidate-email', 'candidate-phone', 'candidate-experience', 'candidate-document']) {
      expect(source).toContain(`htmlFor="${id}"`);
      expect(source).toContain(`id="${id}"`);
    }
  });

  test('estilos globales incluyen objetivos táctiles, fuentes móviles y control de desbordamiento', () => {
    const styles = read('app/globals.css');
    const layout = read('app/layout.tsx');
    expect(styles).toContain('min-width: 44px');
    expect(styles).toContain('min-height: 44px');
    expect(styles).toContain('font-size: 16px');
    expect(styles).toContain('overflow-x: hidden');
    expect(layout).toContain('export const viewport: Viewport');
    expect(layout).toContain('width: "device-width"');
  });
});
