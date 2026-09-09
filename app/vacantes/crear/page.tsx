'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function CrearVacantePage() {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);
      const titulo = fd.get('titulo') as string;

      if (!titulo.trim()) {
        setError('Título requerido');
        setLoading(false);
        return;
      }

      const newId = `vacante-${Date.now()}`;
      const baseUrl = window.location.origin;
      const aplicarLink = `${baseUrl}/postular/${newId}`;

      const newVacante = {
        id: newId,
        titulo,
        descripcion: fd.get('descripcion'),
        departamento: fd.get('departamento'),
        aplicarLink,
      };

      // Save to localStorage AND cookie for persistence
      const saved = localStorage.getItem('vacantes') || '[]';
      const list = JSON.parse(saved);
      list.push(newVacante);
      localStorage.setItem('vacantes', JSON.stringify(list));
      // Also set cookie so it persists across navigations
      document.cookie = `vacantes=${encodeURIComponent(JSON.stringify(list))}; path=/; max-age=604800`;

      setLink(aplicarLink);
      e.currentTarget.reset();
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (link) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #18181b, #27272a, #18181b)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '42rem', width: '100%', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '1rem' }}>✅ ¡Vacante Creada!</h2>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>Tu link de aplicación:</p>
          <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1.5rem', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            <code style={{ color: '#10b981' }}>{link}</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              alert('✅ Copiado al portapapeles');
            }}
            style={{ background: '#059669', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', marginRight: '0.5rem', fontWeight: '500' }}
          >
            📋 Copiar Link
          </button>
          <Link href="/vacantes/crear" style={{ background: '#3f3f46', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', textDecoration: 'none', display: 'inline-block', marginLeft: '0.5rem', fontWeight: '500' }}>
            ➕ Crear Otra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #18181b, #27272a, #18181b)', padding: '1rem' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#a1a1aa', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Volver al inicio
        </Link>

        <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Crear Nueva Vacante</h1>

          {error && (
            <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1rem', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                placeholder="Ej: Desarrollador Senior"
                required
                style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Descripción
              </label>
              <textarea
                name="descripcion"
                placeholder="Describe la posición..."
                rows={5}
                style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Departamento
              </label>
              <input
                type="text"
                name="departamento"
                placeholder="Ej: Tecnología"
                style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: '#059669', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', border: 'none', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: 'inherit' }}
              >
                {loading ? '⏳ Creando...' : '✅ Crear Vacante'}
              </button>
              <Link href="/" style={{ flex: 1, background: '#3f3f46', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', textDecoration: 'none', textAlign: 'center', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                ❌ Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
