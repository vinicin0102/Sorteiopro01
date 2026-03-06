-- =========================================================================
-- CONFIGURAÇÂO COMPLETA DO BANCO DE DADOS (SUPABASE)
-- Copie TUDO deste arquivo e cole no SQL Editor do seu painel Supabase
-- Isso corrigirá todos os problemas de tabelas e permissões do Painel Admin
-- =========================================================================

-- 1. CRIAR TABELA: participantes
CREATE TABLE IF NOT EXISTS participantes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  celular TEXT NOT NULL,
  celular_normalizado TEXT NOT NULL,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_participantes_celular ON participantes(celular_normalizado);
CREATE INDEX IF NOT EXISTS idx_participantes_created_at ON participantes(created_at DESC);

-- 2. CRIAR TABELA: ganhadores
CREATE TABLE IF NOT EXISTS ganhadores (
  id BIGSERIAL PRIMARY KEY,
  participante_id BIGINT,
  nome TEXT NOT NULL,
  celular TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ganhadores_celular ON ganhadores(celular);

-- 3. CRIAR TABELA: configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
  id BIGINT PRIMARY KEY,
  tipo TEXT NOT NULL UNIQUE,
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registros padrões iniciais para não quebrar o admin
INSERT INTO configuracoes (id, tipo, dados) 
VALUES 
  (1, 'formulario', '{}'::jsonb),
  (2, 'comentarios', '{}'::jsonb),
  (3, 'suporte', '{}'::jsonb),
  (4, 'video', '{"embedCode": ""}'::jsonb),
  (5, 'oferta', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. CRIAR TABELA: mensagens_pendentes (chat delay e sincronismo do admin)
CREATE TABLE IF NOT EXISTS mensagens_pendentes (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  exibida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensagens_exibida ON mensagens_pendentes(exibida, timestamp);


-- 5. CRIAR TABELA: oferta_entregas (Para ver quantos receberam a oferta disparada)
CREATE TABLE IF NOT EXISTS oferta_entregas (
  id BIGSERIAL PRIMARY KEY,
  disparo_id BIGINT NOT NULL,
  disparo_timestamp BIGINT NOT NULL,
  participante_nome TEXT,
  participante_celular TEXT,
  user_agent TEXT,
  device TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_disparo_id ON oferta_entregas(disparo_id);
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_disparo_timestamp ON oferta_entregas(disparo_timestamp);
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_celular ON oferta_entregas(participante_celular);


-- 6. CRIAR TABELA: admin_login_logs (Acompanhamento das tentativas de entrada do admin)
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id BIGSERIAL PRIMARY KEY,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    device TEXT,
    attempted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_timestamp ON admin_login_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_success ON admin_login_logs(success);


-- =========================================================================
-- PARTE B: CORRIGIR AS PERMISSÕES DE ACESSO (POLÍTICAS RLS)
-- Isso permite o Admin gravar tudo e os clientes lerem corretamente
-- =========================================================================

-- Habilitar a verificação de política linha por linha em todas as tabelas
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganhadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oferta_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_logs ENABLE ROW LEVEL SECURITY;

-- Apagar políticas antigas defeituosas se existirem (Limpar)
DO $$ 
BEGIN 
    -- participantes
    DROP POLICY IF EXISTS "Permitir inserção de participantes" ON participantes;
    DROP POLICY IF EXISTS "Permitir leitura de participantes" ON participantes;
    DROP POLICY IF EXISTS "Permitir atualização de participantes" ON participantes;

    -- ganhadores
    DROP POLICY IF EXISTS "Permitir leitura de ganhadores" ON ganhadores;
    DROP POLICY IF EXISTS "Permitir inserção de ganhadores" ON ganhadores;
    DROP POLICY IF EXISTS "Permitir atualização de ganhadores" ON ganhadores;
    DROP POLICY IF EXISTS "Permitir deleção de ganhadores" ON ganhadores;
    
    -- configuracoes
    DROP POLICY IF EXISTS "Permitir leitura de configuracoes" ON configuracoes;
    DROP POLICY IF EXISTS "Permitir inserção de configuracoes" ON configuracoes;
    DROP POLICY IF EXISTS "Permitir atualização de configuracoes" ON configuracoes;
    DROP POLICY IF EXISTS "Permitir deleção de configuracoes" ON configuracoes;

    -- mensagens_pendentes
    DROP POLICY IF EXISTS "Permitir leitura mensagens_pendentes" ON mensagens_pendentes;
    DROP POLICY IF EXISTS "Permitir escrita mensagens_pendentes" ON mensagens_pendentes;

    -- oferta_entregas
    DROP POLICY IF EXISTS "Permitir inserção de oferta_entregas" ON oferta_entregas;
    DROP POLICY IF EXISTS "Permitir leitura de oferta_entregas" ON oferta_entregas;

    -- admin_login_logs
    DROP POLICY IF EXISTS "Permitir inserção de logs de acesso" ON admin_login_logs;
    DROP POLICY IF EXISTS "Permitir leitura de logs de acesso" ON admin_login_logs;
END $$;


-- POLÍTICAS NOVAS PERFEITAS (Força a liberar acesso aos clientes Javascript Anonimo)
-- Participantes
CREATE POLICY "Permitir inserção de participantes" ON participantes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir leitura de participantes" ON participantes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir atualização de participantes" ON participantes FOR UPDATE TO anon, authenticated USING (true);

-- Ganhadores
CREATE POLICY "Permitir leitura de ganhadores" ON ganhadores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir inserção de ganhadores" ON ganhadores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de ganhadores" ON ganhadores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir deleção de ganhadores" ON ganhadores FOR DELETE TO anon, authenticated USING (true);

-- Configuracoes
CREATE POLICY "Permitir leitura de configuracoes" ON configuracoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir inserção de configuracoes" ON configuracoes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de configuracoes" ON configuracoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir deleção de configuracoes" ON configuracoes FOR DELETE TO anon, authenticated USING (true);

-- Oferta Entregas
CREATE POLICY "Permitir inserção de oferta_entregas" ON oferta_entregas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir leitura de oferta_entregas" ON oferta_entregas FOR SELECT TO anon, authenticated USING (true);

-- Logs Admin
CREATE POLICY "Permitir inserção de logs de acesso" ON admin_login_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir leitura de logs de acesso" ON admin_login_logs FOR SELECT TO anon, authenticated USING (true);

-- Mensagens Pendentes
CREATE POLICY "Permitir leitura mensagens_pendentes" ON mensagens_pendentes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir escrita mensagens_pendentes" ON mensagens_pendentes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualizacao mensagens_pendentes" ON mensagens_pendentes FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Permitir delecao mensagens_pendentes" ON mensagens_pendentes FOR DELETE TO anon, authenticated USING (true);

-- FIM DO SCRIPT APLICADO COM SUCESSO.
