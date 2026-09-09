'use client';

export default function CrearVacantePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #18181b, #27272a, #18181b)', padding: '1rem' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <a href="/" style={{ color: '#a1a1aa', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Volver al inicio
        </a>

        <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Crear Nueva Vacante</h1>

          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const titulo = fd.get('titulo') as string;
            if (!titulo.trim()) {
              alert('El título es requerido');
              return;
            }
            const id = `vacante-${Date.now()}`;
            const url = `${window.location.origin}/postular/${id}`;
            try {
              const saved = localStorage.getItem('vacantes');
              const list = saved ? JSON.parse(saved) : [];
              list.push({ id, titulo, descripcion: fd.get('descripcion'), departamento: fd.get('departamento'), aplicarLink: url });
              localStorage.setItem('vacantes', JSON.stringify(list));
              alert(`✅ Vacante creada!\n\nLink:\n${url}`);
              e.currentTarget.reset();
            } catch (err) {
              alert('Error: ' + err);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Título *
              </label>
              <input type="text" name="titulo" placeholder="Ej: Desarrollador Senior" required style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Descripción
              </label>
              <textarea name="descripcion" placeholder="Describe la posición..." rows={5} style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white', fontFamily: 'inherit', resize: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem' }}>
                Departamento
              </label>
              <input type="text" name="departamento" placeholder="Ej: Tecnología" style={{ width: '100%', padding: '0.5rem 1rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.375rem', color: 'white' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
              <button type="submit" style={{ flex: 1, background: '#059669', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
                Crear Vacante
              </button>
              <a href="/" style={{ flex: 1, background: '#3f3f46', color: 'white', padding: '0.75rem', borderRadius: '0.375rem', textDecoration: 'none', textAlign: 'center', fontWeight: '500' }}>
                Cancelar
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
