# Configuração do Supabase 🗄️

## 1. Criar as Tabelas no Supabase

Acesse o Supabase Dashboard: https://supabase.com/dashboard

Vá em **SQL Editor** e execute os seguintes scripts:

### Tabela: participantes

```sql
CREATE TABLE IF NOT EXISTS participantes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  celular TEXT NOT NULL,
  celular_normalizado TEXT NOT NULL,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por celular
CREATE INDEX IF NOT EXISTS idx_participantes_celular ON participantes(celular_normalizado);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_participantes_created_at ON participantes(created_at DESC);
```

### Tabela: ganhadores

```sql
CREATE TABLE IF NOT EXISTS ganhadores (
  id BIGSERIAL PRIMARY KEY,
  participante_id BIGINT,
  nome TEXT NOT NULL,
  celular TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_ganhadores_celular ON ganhadores(celular);
```

### Tabela: configuracoes

```sql
CREATE TABLE IF NOT EXISTS configuracoes (
  id BIGINT PRIMARY KEY,
  tipo TEXT NOT NULL UNIQUE,
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registros iniciais
INSERT INTO configuracoes (id, tipo, dados) 
VALUES 
  (1, 'formulario', '{}'::jsonb),
  (2, 'comentarios', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
```

### Tabela: mensagens_pendentes (Opcional - para chat em tempo real)

```sql
CREATE TABLE IF NOT EXISTS mensagens_pendentes (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  exibida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar mensagens não exibidas
CREATE INDEX IF NOT EXISTS idx_mensagens_exibida ON mensagens_pendentes(exibida, timestamp);
```

## 2. Configurar Row Level Security (RLS)

### Política para participantes (Leitura pública, escrita pública)

```sql
-- Habilitar RLS
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode inserir participantes
CREATE POLICY "Permitir inserção de participantes"
ON participantes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: Qualquer um pode ler participantes
CREATE POLICY "Permitir leitura de participantes"
ON participantes
FOR SELECT
TO anon, authenticated
USING (true);

-- Política: Apenas service_role pode atualizar
CREATE POLICY "Permitir atualização de participantes"
ON participantes
FOR UPDATE
TO service_role
USING (true);
```

### Política para ganhadores

```sql
ALTER TABLE ganhadores ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler ganhadores
CREATE POLICY "Permitir leitura de ganhadores"
ON ganhadores
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir inserção para anon (para o admin funcionar)
CREATE POLICY "Permitir inserção de ganhadores"
ON ganhadores
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir atualização/deleção para anon
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
```

### Política para configuracoes

```sql
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler configurações
CREATE POLICY "Permitir leitura de configuracoes"
ON configuracoes
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir inserção/atualização para anon (para o admin funcionar)
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
```

## 3. Verificar as Configurações

1. Vá em **Settings** > **API**
2. Verifique se as chaves estão corretas:
   - URL: `https://uxbbhesufnxgszvbwkoa.supabase.co`
   - Anon key: (sua chave anon)
   - Service role key: (sua chave service - NUNCA exponha no frontend!)

## 4. Testar a Conexão

Abra o console do navegador e verifique se não há erros ao carregar as páginas.

## 5. Migração de Dados (Opcional)

Se você já tinha dados no localStorage, pode criar um script para migrar:

```javascript
// Execute no console do navegador quando logado como admin
const participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');

for (const p of participantes) {
    await saveParticipant(p.nome, p.celular);
}

const winners = JSON.parse(localStorage.getItem('webinar_winners') || '[]');
if (winners.length > 0) {
    await saveWinners(winners);
}
```

## ✅ Pronto!

Agora seu sistema está usando o Supabase como banco de dados principal, com fallback para localStorage caso haja algum problema de conexão.

