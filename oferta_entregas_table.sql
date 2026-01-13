-- ============================================
-- TABELA: oferta_entregas
-- ============================================
-- Rastreia cada entrega de popup de oferta para usuários
-- ============================================

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

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_disparo_id ON oferta_entregas(disparo_id);
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_disparo_timestamp ON oferta_entregas(disparo_timestamp);
CREATE INDEX IF NOT EXISTS idx_oferta_entregas_celular ON oferta_entregas(participante_celular);

-- Política RLS para permitir inserção e leitura
ALTER TABLE oferta_entregas ENABLE ROW LEVEL SECURITY;

-- Permitir inserção para todos
DROP POLICY IF EXISTS "Permitir inserção de oferta_entregas" ON oferta_entregas;
CREATE POLICY "Permitir inserção de oferta_entregas"
ON oferta_entregas
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir leitura para todos (para contagem)
DROP POLICY IF EXISTS "Permitir leitura de oferta_entregas" ON oferta_entregas;
CREATE POLICY "Permitir leitura de oferta_entregas"
ON oferta_entregas
FOR SELECT
TO anon, authenticated
USING (true);

