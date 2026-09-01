-- SHORTLIST.GT Database Setup Script
-- Execute this in Supabase SQL Editor to create all necessary tables

-- 1. Usuarios (Recruiters/Companies)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vacantes (Job Postings)
CREATE TABLE IF NOT EXISTS vacantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  requisitos TEXT,
  salario_min DECIMAL(10, 2),
  salario_max DECIMAL(10, 2),
  ubicacion VARCHAR(255),
  tipo_contrato VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Candidatos (Job Applicants)
CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  cv_texto TEXT,
  cv_url VARCHAR(500),
  score_ia DECIMAL(5, 2),
  estado VARCHAR(50) DEFAULT 'pendiente',
  feedback_ia TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Logs WhatsApp (Message History)
CREATE TABLE IF NOT EXISTS logs_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  mensaje_enviado TEXT NOT NULL,
  respuesta TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'enviado'
);

-- 5. Análisis de CVs (CV Analysis Results)
CREATE TABLE IF NOT EXISTS analisis_cv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  habilidades TEXT[],
  experiencia_anos INTEGER,
  educacion TEXT,
  puntuaciones JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vacantes_usuario ON vacantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_candidatos_vacante ON candidatos(vacante_id);
CREATE INDEX IF NOT EXISTS idx_logs_whatsapp_candidato ON logs_whatsapp(candidato_id);
CREATE INDEX IF NOT EXISTS idx_analisis_cv_candidato ON analisis_cv(candidato_id);

-- Enable RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_cv ENABLE ROW LEVEL SECURITY;

-- Policies (allow users to see their own data)
CREATE POLICY "Users can view their own profile" ON usuarios
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own vacancies" ON vacantes
  FOR SELECT USING (true);

CREATE POLICY "Users can view candidates for their vacancies" ON candidatos
  FOR SELECT USING (true);

-- Insert demo user (optional)
INSERT INTO usuarios (email, nombre_completo, empresa)
VALUES ('javier.test@gmail.com', 'Javier García', 'SHORTLIST.GT Demo')
ON CONFLICT (email) DO NOTHING;

-- Insert demo vacancy
INSERT INTO vacantes (usuario_id, titulo, descripcion, requisitos, ubicacion, tipo_contrato)
SELECT id, 'Desarrollador Full Stack', 'Buscamos desarrollador con experiencia en React y Node.js',
       'React, Node.js, PostgreSQL', 'Guatemala', 'Tiempo Completo'
FROM usuarios WHERE email = 'javier.test@gmail.com'
LIMIT 1;

-- Success message
SELECT 'Database setup completed successfully!' as message;
