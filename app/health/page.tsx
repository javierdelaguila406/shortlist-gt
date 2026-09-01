export default function HealthCheck() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'sans-serif',
      padding: '20px',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>✅ Servidor Funcionando</h1>
      <p style={{ fontSize: '16px', marginBottom: '30px', color: '#888' }}>
        Si ves este mensaje, el servidor está respondiendo correctamente en tu móvil.
      </p>

      <div style={{
        backgroundColor: '#111',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        maxWidth: '100%',
        wordBreak: 'break-word',
      }}>
        <p style={{ margin: '10px 0', fontSize: '14px' }}>
          <strong>User Agent:</strong><br />
          {typeof navigator !== 'undefined' ? navigator.userAgent : 'No disponible'}
        </p>
        <p style={{ margin: '10px 0', fontSize: '14px' }}>
          <strong>Viewport:</strong><br />
          {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'No disponible'}
        </p>
        <p style={{ margin: '10px 0', fontSize: '14px' }}>
          <strong>Hora del Servidor:</strong><br />
          {new Date().toLocaleString()}
        </p>
      </div>

      <a href="/" style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#10b981',
        color: '#000',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '16px',
      }}>
        Ir a la Página Principal
      </a>
    </div>
  );
}
