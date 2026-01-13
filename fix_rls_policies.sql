-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS DO SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para permitir que o admin funcione corretamente
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES DE GANHADORES
DROP POLICY IF EXISTS "Permitir modificação de ganhadores" ON ganhadores;
DROP POLICY IF EXISTS "Permitir inserção de ganhadores" ON ganhadores;
DROP POLICY IF EXISTS "Permitir atualização de ganhadores" ON ganhadores;
DROP POLICY IF EXISTS "Permitir deleção de ganhadores" ON ganhadores;

-- 2. CRIAR NOVAS POLÍTICAS PARA GANHADORES
CREATE POLICY "Permitir inserção de ganhadores"
ON ganhadores
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de ganhadores"
ON ganhadores
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir deleção de ganhadores"
ON ganhadores
FOR DELETE
TO anon, authenticated
USING (true);

-- 3. REMOVER TODAS AS POLÍTICAS EXISTENTES DE CONFIGURAÇÕES
DROP POLICY IF EXISTS "Permitir modificação de configuracoes" ON configuracoes;
DROP POLICY IF EXISTS "Permitir inserção de configuracoes" ON configuracoes;
DROP POLICY IF EXISTS "Permitir atualização de configuracoes" ON configuracoes;
DROP POLICY IF EXISTS "Permitir deleção de configuracoes" ON configuracoes;

-- 4. CRIAR NOVAS POLÍTICAS PARA CONFIGURAÇÕES
CREATE POLICY "Permitir inserção de configuracoes"
ON configuracoes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de configuracoes"
ON configuracoes
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir deleção de configuracoes"
ON configuracoes
FOR DELETE
TO anon, authenticated
USING (true);

-- 5. REMOVER TODAS AS POLÍTICAS EXISTENTES DE OFERTA_ENTREGAS
DROP POLICY IF EXISTS "Permitir inserção de oferta_entregas" ON oferta_entregas;
DROP POLICY IF EXISTS "Permitir leitura de oferta_entregas" ON oferta_entregas;

-- 6. CRIAR NOVAS POLÍTICAS PARA OFERTA_ENTREGAS (se a tabela existir)
-- Primeiro, verifique se a tabela existe criando-a se necessário:
-- (Execute o script oferta_entregas_table.sql primeiro)

-- Políticas já criadas no oferta_entregas_table.sql, mas adicionando aqui para consistência:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oferta_entregas') THEN
        -- Permitir inserção
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oferta_entregas' AND policyname = 'Permitir inserção de oferta_entregas') THEN
            CREATE POLICY "Permitir inserção de oferta_entregas"
            ON oferta_entregas
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);
        END IF;
        
        -- Permitir leitura
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oferta_entregas' AND policyname = 'Permitir leitura de oferta_entregas') THEN
            CREATE POLICY "Permitir leitura de oferta_entregas"
            ON oferta_entregas
            FOR SELECT
            TO anon, authenticated
            USING (true);
        END IF;
    END IF;
END $$;

-- ============================================
-- VERIFICAR POLÍTICAS (OPCIONAL)
-- ============================================
-- Execute para ver todas as políticas:
-- SELECT * FROM pg_policies WHERE tablename IN ('ganhadores', 'configuracoes', 'oferta_entregas');

