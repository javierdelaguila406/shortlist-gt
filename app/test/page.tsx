export default function TestPage() {
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        SHORTLIST<span style={{ color: '#10b981' }}>.</span>GT
      </h1>

      <p style={{
        fontSize: '18px',
        marginBottom: '40px',
        textAlign: 'center',
        color: '#888',
      }}>
        Reclutamiento Inteligente Impulsado por IA
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '300px',
      }}>
        <a href="/" style={{
          display: 'block',
          padding: '15px 20px',
          backgroundColor: '#10b981',
          color: '#000',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '16px',
        }}>
          Home
        </a>

        <a href="/dashboard/demo" style={{
          display: 'block',
          padding: '15px 20px',
          backgroundColor: '#374151',
          color: '#fff',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '16px',
        }}>
          Demo Dashboard
        </a>

        <a href="/postular/sample" style={{
          display: 'block',
          padding: '15px 20px',
          backgroundColor: '#374151',
          color: '#fff',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '16px',
        }}>
          Postularse
        </a>

        <a href="/auth/login" style={{
          display: 'block',
          padding: '15px 20px',
          backgroundColor: '#374151',
          color: '#fff',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '16px',
        }}>
          Login
        </a>
      </div>

      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#111',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#888',
        textAlign: 'center',
        maxWidth: '100%',
      }}>
        <p>✅ Si ves este mensaje, tu móvil está conectado correctamente.</p>
        <p style={{ marginTop: '10px' }}>Haz clic en los botones para probar diferentes secciones.</p>
      </div>
    </div>
  );
}
