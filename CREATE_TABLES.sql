-- Create vacantes table
CREATE TABLE IF NOT EXISTS vacantes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL DEFAULT 'public',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  slug TEXT,
  departamento TEXT,
  salario_minimo BIGINT,
  salario_maximo BIGINT,
  ubicacion TEXT,
  tipo_contrato TEXT,
  estado TEXT DEFAULT 'activa',
  criterios_minimos JSONB,
  preguntas_test JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidatos table
CREATE TABLE IF NOT EXISTS candidatos (
  id TEXT PRIMARY KEY,
  vacante_id TEXT NOT NULL REFERENCES vacantes(id),
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT NOT NULL,
  cv_url TEXT,
  cv_texto TEXT,
  score_cv BIGINT DEFAULT 0,
  score_video BIGINT DEFAULT 0,
  score_test BIGINT DEFAULT 0,
  score_ia BIGINT DEFAULT 0,
  score_total BIGINT DEFAULT 0,
  disponibilidad TEXT,
  rango_salario TEXT,
  link_linkedin TEXT,
  estado TEXT DEFAULT 'pendiente',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on vacante_id for faster queries
CREATE INDEX IF NOT EXISTS idx_candidatos_vacante_id ON candidatos(vacante_id);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to vacantes and candidatos
CREATE POLICY "vacantes_public_read" ON vacantes FOR SELECT USING (TRUE);
CREATE POLICY "candidatos_public_insert" ON candidatos FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "candidatos_public_read" ON candidatos FOR SELECT USING (TRUE);
CREATE POLICY "vacantes_public_insert" ON vacantes FOR INSERT WITH CHECK (TRUE);
