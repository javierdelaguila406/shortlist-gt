-- SHORTLIST.GT - Database Updates (Evaluaciones WhatsApp y Scoring)
-- Execute this in Supabase SQL Editor

-- 1. ALTER tabla candidatos para agregar campos de scoring
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS score_cv DECIMAL(5, 2);
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS score_video DECIMAL(5, 2);
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS score_test DECIMAL(5, 2);
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS score_total DECIMAL(5, 2);
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS estado_evaluacion VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS resumen_ejecutivo TEXT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS analisis_ia JSONB;

-- 2. Crear tabla evaluaciones_whatsapp
CREATE TABLE IF NOT EXISTS evaluaciones_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  vacante_id UUID REFERENCES vacantes(id) ON DELETE SET NULL,
  paso INTEGER DEFAULT 1,
  estado VARCHAR(50) DEFAULT 'en_proceso',
  respuesta_confirmacion TEXT,
  videos JSONB DEFAULT '[]'::jsonb,
  respuestas_test JSONB DEFAULT '[]'::jsonb,
  mensaje_confirmacion_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear índices para evaluaciones
CREATE INDEX IF NOT EXISTS idx_evaluaciones_candidato ON evaluaciones_whatsapp(candidato_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_vacante ON evaluaciones_whatsapp(vacante_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_estado ON evaluaciones_whatsapp(estado);

-- 4. Habilitar RLS en evaluaciones_whatsapp
ALTER TABLE evaluaciones_whatsapp ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acceso
CREATE POLICY "Users can view evaluations for their candidates" ON evaluaciones_whatsapp
  FOR SELECT USING (true);

-- 6. Mejorar tabla logs_whatsapp
ALTER TABLE logs_whatsapp ADD COLUMN IF NOT EXISTS tipo_evento VARCHAR(50);
ALTER TABLE logs_whatsapp ADD COLUMN IF NOT EXISTS contenido JSONB;
ALTER TABLE logs_whatsapp ADD COLUMN IF NOT EXISTS evaluacion_id UUID REFERENCES evaluaciones_whatsapp(id);

-- 7. Crear tabla para emails de invitación
CREATE TABLE IF NOT EXISTS invitaciones_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  email_destinatario VARCHAR(255) NOT NULL,
  nombre_candidato VARCHAR(255),
  token_unico VARCHAR(255) UNIQUE,
  estado VARCHAR(50) DEFAULT 'enviado',
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_aceptacion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_vacante ON invitaciones_email(vacante_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email ON invitaciones_email(email_destinatario);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON invitaciones_email(token_unico);

-- 8. Actualizar columna slug en vacantes si no existe
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS salario_minimo DECIMAL(10, 2);
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS salario_maximo DECIMAL(10, 2);

-- 9. Crear tabla para tracking de estado de candidatos
CREATE TABLE IF NOT EXISTS candidato_estado_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  razon TEXT
);

CREATE INDEX IF NOT EXISTS idx_candidato_estado_log ON candidato_estado_log(candidato_id);

-- 10. Actualizar RLS en logs_whatsapp
ALTER TABLE logs_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their candidates" ON logs_whatsapp
  FOR SELECT USING (true);

-- 11. Crear vista para resumen de candidatos
CREATE OR REPLACE VIEW v_candidatos_resumen AS
SELECT
  c.id,
  c.nombre,
  c.email,
  c.telefono,
  c.vacante_id,
  v.titulo as vacante_titulo,
  c.score_cv,
  c.score_video,
  c.score_test,
  c.score_total,
  c.estado,
  c.estado_evaluacion,
  c.created_at,
  COALESCE(c.score_total, c.score_cv, 0) as score_para_ordenar
FROM candidatos c
LEFT JOIN vacantes v ON c.vacante_id = v.id
ORDER BY c.created_at DESC;

-- 12. Commit message
SELECT 'Database updates completed successfully!' as message;
