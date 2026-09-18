-- Crear tabla de códigos de licencia
CREATE TABLE IF NOT EXISTS license_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'inactive')),
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  created_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Crear tabla de empresas (si no existe)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  nombre VARCHAR(255),
  plan VARCHAR(50) NOT NULL DEFAULT 'demo' CHECK (plan IN ('demo', 'premium')),
  license_code_used VARCHAR(255),
  plan_upgraded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_license_codes_code ON license_codes(code);
CREATE INDEX IF NOT EXISTS idx_license_codes_status ON license_codes(status);
CREATE INDEX IF NOT EXISTS idx_license_codes_used_by_user_id ON license_codes(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);

-- RLS (Row Level Security) para license_codes
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

-- Permitir que el admin vea todos los códigos
CREATE POLICY "Admin can view all license codes" ON license_codes
  FOR SELECT USING (
    (SELECT user_id FROM companies WHERE user_id = auth.uid()) IS NOT NULL
  );

-- Permitir que el usuario vea sus propios códigos usados
CREATE POLICY "Users can view their own used codes" ON license_codes
  FOR SELECT USING (used_by_user_id = auth.uid());

-- RLS para companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Permitir que cada usuario vea solo su registro
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (user_id = auth.uid());

-- Permitir que cada usuario actualice su registro
CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE USING (user_id = auth.uid());

-- Permitir que el usuario inserte su registro
CREATE POLICY "Users can insert their own company" ON companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Comentarios para documentación
COMMENT ON TABLE license_codes IS 'Códigos de licencia para activar Premium. Cada código se puede usar solo una vez.';
COMMENT ON TABLE companies IS 'Información de las empresas/usuarios. Plan: demo (limitado) o premium (ilimitado).';
COMMENT ON COLUMN license_codes.status IS 'unused: disponible, used: ya fue usado, inactive: desactivado manualmente';
COMMENT ON COLUMN companies.plan IS 'demo: limitado a 1 vacante, 1 candidato, 1 evaluación; premium: ilimitado';
