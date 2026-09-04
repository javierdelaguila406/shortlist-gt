-- Tabla para auditoría de acciones de privacidad (Derecho al Olvido)
CREATE TABLE IF NOT EXISTS logs_privacidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accion VARCHAR(50) NOT NULL,
  candidato_id UUID REFERENCES candidatos(id) ON DELETE SET NULL,
  candidato_nombre VARCHAR(255),
  candidato_email VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_origen VARCHAR(45),
  motivo TEXT,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(50) DEFAULT 'completado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_logs_privacidad_accion ON logs_privacidad(accion);
CREATE INDEX IF NOT EXISTS idx_logs_privacidad_candidato ON logs_privacidad(candidato_id);
CREATE INDEX IF NOT EXISTS idx_logs_privacidad_timestamp ON logs_privacidad(timestamp DESC);

-- Tabla para solicitudes de derecho al olvido en proceso
CREATE TABLE IF NOT EXISTS solicitudes_olvido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID REFERENCES candidatos(id) ON DELETE CASCADE,
  candidato_email VARCHAR(255),
  candidato_telefono VARCHAR(20),
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_completada TIMESTAMPTZ,
  razon TEXT,
  verificacion_token VARCHAR(255),
  verificacion_completada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para solicitudes
CREATE INDEX IF NOT EXISTS idx_solicitudes_olvido_estado ON solicitudes_olvido(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_olvido_candidato ON solicitudes_olvido(candidato_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_olvido_email ON solicitudes_olvido(candidato_email);

-- RLS para logs_privacidad (solo admin y superuser)
ALTER TABLE logs_privacidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view privacy logs" ON logs_privacidad
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'role') = 'superuser'
  );

-- RLS para solicitudes_olvido
ALTER TABLE solicitudes_olvido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own olvido requests" ON solicitudes_olvido
  FOR SELECT USING (
    auth.email() = candidato_email
  );

CREATE POLICY "Admins can view all olvido requests" ON solicitudes_olvido
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'role') = 'superuser'
  );

-- Función para registrar eliminación de datos automáticamente
CREATE OR REPLACE FUNCTION log_data_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs_privacidad (
    accion,
    candidato_id,
    candidato_nombre,
    candidato_email,
    motivo,
    estado
  ) VALUES (
    'ELIMINACION',
    OLD.id,
    OLD.nombre,
    OLD.email,
    'Registro eliminado automáticamente',
    'completado'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar eliminaciones
CREATE TRIGGER trigger_log_candidato_deletion
BEFORE DELETE ON candidatos
FOR EACH ROW
EXECUTE FUNCTION log_data_deletion();

-- Vista de reporte de cumplimiento de privacidad
CREATE OR REPLACE VIEW v_privacy_compliance AS
SELECT
  DATE_TRUNC('month', timestamp) as mes,
  accion,
  COUNT(*) as cantidad,
  COUNT(DISTINCT candidato_id) as candidatos_afectados
FROM logs_privacidad
GROUP BY DATE_TRUNC('month', timestamp), accion
ORDER BY mes DESC, cantidad DESC;

-- Procedimiento para exportar datos de un candidato (DPIA - Portabilidad)
CREATE OR REPLACE FUNCTION export_candidato_data(p_candidato_id UUID)
RETURNS TABLE (
  candidato_id UUID,
  nombre VARCHAR,
  email VARCHAR,
  telefono VARCHAR,
  datos_personales JSONB,
  evaluacion_ia JSONB,
  historial_aplicaciones JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.email,
    c.telefono,
    jsonb_build_object(
      'nombre', c.nombre,
      'email', c.email,
      'telefono', c.telefono,
      'fecha_creacion', c.created_at,
      'disponibilidad', c.disponibilidad
    ),
    jsonb_build_object(
      'score_ia', c.score_ia,
      'feedback', c.feedback_ia,
      'resumen', c.resumen_ejecutivo
    ),
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'vacante_id', v.id,
          'vacante_titulo', v.titulo,
          'fecha_aplicacion', c.created_at,
          'estado', 'aplicado'
        )
      )
      FROM candidatos c
      JOIN vacantes v ON TRUE
      WHERE c.id = p_candidato_id
    )
  FROM candidatos c
  WHERE c.id = p_candidato_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación de cumplimiento
COMMENT ON TABLE logs_privacidad IS 'Auditoría de acciones de privacidad y derecho al olvido (Art. 17 GDPR)';
COMMENT ON TABLE solicitudes_olvido IS 'Solicitudes de eliminación de datos (Derecho al Olvido)';
COMMENT ON FUNCTION export_candidato_data IS 'Exporta todos los datos personales de un candidato (Derecho de Portabilidad, Art. 20 GDPR)';
COMMENT ON VIEW v_privacy_compliance IS 'Reporte de cumplimiento normativo de privacidad';
