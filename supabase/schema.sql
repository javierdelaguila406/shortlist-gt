-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create tables
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('reclutador', 'administrador')),
  empresa_id UUID,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  slug TEXT UNIQUE NOT NULL,
  departamento TEXT,
  salario_minimo DECIMAL(10, 2),
  salario_maximo DECIMAL(10, 2),
  ubicacion TEXT,
  tipo_contrato TEXT,
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cerrada')),
  criterios_minimos JSONB,
  preguntas_test JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacante_id UUID NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT NOT NULL,
  cv_url TEXT,
  cv_texto TEXT,
  score_cv DECIMAL(3, 2) DEFAULT 0,
  score_video DECIMAL(3, 2) DEFAULT 0,
  score_test DECIMAL(3, 2) DEFAULT 0,
  score_total DECIMAL(3, 2) DEFAULT 0,
  disponibilidad TEXT,
  rango_salario TEXT,
  link_linkedin TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'oferta')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluaciones_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  vacante_id UUID NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  paso INTEGER DEFAULT 1 CHECK (paso >= 1 AND paso <= 3),
  estado TEXT DEFAULT 'en_proceso' CHECK (estado IN ('en_proceso', 'completado', 'abandonado')),
  mensaje_confirmacion_enviado BOOLEAN DEFAULT FALSE,
  respuesta_confirmacion TEXT,
  videos JSONB DEFAULT '[]'::jsonb,
  respuestas_test JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archivos_cv (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  url_archivo TEXT NOT NULL,
  formato TEXT,
  tamaño INTEGER,
  procesado BOOLEAN DEFAULT FALSE,
  texto_extraido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id UUID NOT NULL REFERENCES evaluaciones_whatsapp(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  contenido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vacantes_usuario_id ON vacantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vacantes_slug ON vacantes(slug);
CREATE INDEX IF NOT EXISTS idx_candidatos_vacante_id ON candidatos(vacante_id);
CREATE INDEX IF NOT EXISTS idx_candidatos_estado ON candidatos(estado);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_candidato_id ON evaluaciones_whatsapp(candidato_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_vacante_id ON evaluaciones_whatsapp(vacante_id);
CREATE INDEX IF NOT EXISTS idx_archivos_candidato_id ON archivos_cv(candidato_id);
CREATE INDEX IF NOT EXISTS idx_logs_evaluacion_id ON logs_whatsapp(evaluacion_id);

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_cv ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_whatsapp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "usuarios_select_self" ON usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "usuarios_update_self" ON usuarios FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for vacantes
CREATE POLICY "vacantes_select_own" ON vacantes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "vacantes_insert_own" ON vacantes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "vacantes_update_own" ON vacantes FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "vacantes_delete_own" ON vacantes FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies for candidatos
CREATE POLICY "candidatos_select_own" ON candidatos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = candidatos.vacante_id AND v.usuario_id = auth.uid()
  ));
CREATE POLICY "candidatos_insert_own" ON candidatos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = candidatos.vacante_id AND v.usuario_id = auth.uid()
  ));
CREATE POLICY "candidatos_update_own" ON candidatos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = candidatos.vacante_id AND v.usuario_id = auth.uid()
  ));

-- RLS Policies for evaluaciones_whatsapp
CREATE POLICY "evaluaciones_select_own" ON evaluaciones_whatsapp FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id = auth.uid()
  ));
CREATE POLICY "evaluaciones_insert_own" ON evaluaciones_whatsapp FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id = auth.uid()
  ));
CREATE POLICY "evaluaciones_update_own" ON evaluaciones_whatsapp FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vacantes v WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id = auth.uid()
  ));

-- RLS Policies for archivos_cv
CREATE POLICY "archivos_select_own" ON archivos_cv FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM candidatos c
    JOIN vacantes v ON v.id = c.vacante_id
    WHERE c.id = archivos_cv.candidato_id AND v.usuario_id = auth.uid()
  ));
CREATE POLICY "archivos_insert_own" ON archivos_cv FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidatos c
    JOIN vacantes v ON v.id = c.vacante_id
    WHERE c.id = archivos_cv.candidato_id AND v.usuario_id = auth.uid()
  ));

-- RLS Policies for logs_whatsapp
CREATE POLICY "logs_select_own" ON logs_whatsapp FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM evaluaciones_whatsapp e
    JOIN vacantes v ON v.id = e.vacante_id
    WHERE e.id = logs_whatsapp.evaluacion_id AND v.usuario_id = auth.uid()
  ));
