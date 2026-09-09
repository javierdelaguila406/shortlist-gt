'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function CrearVacantePage() {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/vacantes/crear', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al crear vacante');
        return;
      }

      setLink(result.vacante.aplicarLink);
      e.currentTarget.reset();

      // Save to localStorage
      try {
        const saved = localStorage.getItem('vacantes') || '[]';
        const list = JSON.parse(saved);
        list.push(result.vacante);
        localStorage.setItem('vacantes', JSON.stringify(list));
      } catch (e) {
        console.log('localStorage error:', e);
      }
    } catch (err) {
      setError('Error de conexión');
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
          <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            <code style={{ color: '#10b981', fontSize: '0.875rem' }}>{link}</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              alert('Copiado al portapapeles');
            }}
            style={{ background: '#059669', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}
          >
            Copiar
          </button>
          <Link href="/vacantes/crear" style={{ background: '#3f3f46', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', textDecoration: 'none', display: 'inline-block' }}>
            Crear otra
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
                style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', boxSizing: 'border-box' }}
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
                style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, background: '#059669', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', border: 'none', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Creando...' : 'Crear Vacante'}
              </button>
              <Link href="/" style={{ flex: 1, background: '#3f3f46', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', textDecoration: 'none', textAlign: 'center', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
