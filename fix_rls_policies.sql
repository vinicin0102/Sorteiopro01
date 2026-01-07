-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS DO SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para permitir que o admin funcione corretamente
-- ============================================

-- 1. REMOVER POLÍTICAS ANTIGAS DE GANHADORES
DROP POLICY IF EXISTS "Permitir modificação de ganhadores" ON ganhadores;

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

-- 3. REMOVER POLÍTICAS ANTIGAS DE CONFIGURAÇÕES
DROP POLICY IF EXISTS "Permitir modificação de configuracoes" ON configuracoes;

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

-- ============================================
-- VERIFICAR POLÍTICAS (OPCIONAL)
-- ============================================
-- Execute para ver todas as políticas:
-- SELECT * FROM pg_policies WHERE tablename IN ('ganhadores', 'configuracoes');

