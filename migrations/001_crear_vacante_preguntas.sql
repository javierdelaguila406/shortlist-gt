-- Crear tabla vacante_preguntas si no existe
CREATE TABLE IF NOT EXISTS public.vacante_preguntas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vacante_id VARCHAR NOT NULL,
    pre_entrevista JSONB DEFAULT '[]'::jsonb,
    prueba_tecnica JSONB DEFAULT '[]'::jsonb,
    preguntas_video JSONB DEFAULT '[]'::jsonb,
    nivel_requerido VARCHAR,
    generado_por VARCHAR DEFAULT 'template',
    categoria_template VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vacante_id)
);

-- Crear índice para vacante_id
CREATE INDEX IF NOT EXISTS idx_vacante_preguntas_vacante_id ON public.vacante_preguntas(vacante_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.vacante_preguntas ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura/escritura
CREATE POLICY "Allow all" ON public.vacante_preguntas
    FOR ALL
    USING (true)
    WITH CHECK (true);
