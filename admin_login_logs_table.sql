-- Tabela para armazenar logs de acesso ao painel admin
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de logs de acesso admin
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id BIGSERIAL PRIMARY KEY,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    device TEXT,
    attempted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índice para buscas rápidas por timestamp
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_timestamp ON admin_login_logs(timestamp DESC);

-- Criar índice para buscas por sucesso/falha
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_success ON admin_login_logs(success);

-- Política RLS: Permitir inserção de logs (anon)
CREATE POLICY IF NOT EXISTS "Permitir inserção de logs de acesso"
ON admin_login_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Política RLS: Permitir leitura de logs (anon) - para o admin poder ver
CREATE POLICY IF NOT EXISTS "Permitir leitura de logs de acesso"
ON admin_login_logs
FOR SELECT
TO anon
USING (true);

-- Política RLS: Permitir tudo para service_role (backend)
CREATE POLICY IF NOT EXISTS "Permitir tudo para service_role"
ON admin_login_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comentários na tabela
COMMENT ON TABLE admin_login_logs IS 'Registra todos os acessos e tentativas de login no painel admin';
COMMENT ON COLUMN admin_login_logs.success IS 'true se login foi bem-sucedido, false se falhou';
COMMENT ON COLUMN admin_login_logs.timestamp IS 'Data e hora do acesso/tentativa';
COMMENT ON COLUMN admin_login_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN admin_login_logs.device IS 'Tipo de dispositivo (mobile/desktop)';
COMMENT ON COLUMN admin_login_logs.attempted IS 'Indica se houve tentativa de login (senha digitada)';


