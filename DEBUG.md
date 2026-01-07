# Como Debuggar o Problema de Participantes 🐛

## Passos para Verificar

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
- Ou `Cmd+Option+I` (Mac)
- Vá na aba **Console**

### 2. Acesse o Admin
- Vá para `/admin`
- Faça login
- Vá na aba **Sorteio**

### 3. Verifique os Logs

Você deve ver mensagens como:
- ✅ `Supabase inicializado via...` = Supabase carregou
- ✅ `Buscando participantes do Supabase...` = Tentando buscar
- ✅ `Participantes encontrados no Supabase: X` = Encontrou participantes
- ❌ `Erro ao buscar participantes...` = Problema na busca

### 4. Possíveis Problemas

#### Problema 1: Supabase não inicializa
**Sintoma:** Vê `Supabase não disponível` no console

**Solução:** 
- Verifique se a biblioteca está carregando
- Recarregue a página

#### Problema 2: Erro de RLS (Row Level Security)
**Sintoma:** Vê erro `new row violates row-level security policy`

**Solução:** Execute no SQL Editor do Supabase:
```sql
-- Remover RLS temporariamente para testar (não recomendado em produção)
ALTER TABLE participantes DISABLE ROW LEVEL SECURITY;

-- Ou criar política mais permissiva
DROP POLICY IF EXISTS "Permitir leitura de participantes" ON participantes;
CREATE POLICY "Permitir leitura de participantes"
ON participantes
FOR SELECT
TO anon, authenticated
USING (true);
```

#### Problema 3: Tabela vazia
**Sintoma:** `Participantes encontrados: 0`

**Solução:**
- Verifique se há dados na tabela no Supabase Dashboard
- Teste inserir um registro manualmente:
```sql
INSERT INTO participantes (nome, celular, celular_normalizado, device)
VALUES ('Teste', '(11) 99999-9999', '11999999999', 'desktop');
```

#### Problema 4: Dados em localStorage mas não no Supabase
**Sintoma:** Participantes aparecem só depois de recarregar

**Solução:**
- Os dados estão salvos apenas localmente
- Crie um script de migração ou aguarde que os novos cadastros sejam salvos no Supabase

### 5. Teste Manual no Console

Cole este código no console do navegador:

```javascript
// Testar conexão
(async function() {
    const db = await getSupabase();
    if (!db) {
        console.error('❌ Supabase não conectado');
        return;
    }
    
    console.log('✅ Supabase conectado');
    
    // Testar busca
    const { data, error } = await db
        .from('participantes')
        .select('*')
        .limit(5);
    
    if (error) {
        console.error('❌ Erro:', error);
    } else {
        console.log('✅ Participantes encontrados:', data);
        console.log('Total:', data.length);
    }
})();
```

### 6. Verificar no Supabase Dashboard

1. Vá em **Table Editor** > **participantes**
2. Veja se há registros
3. Se não houver, os dados estão só no localStorage

### 7. Migrar dados do localStorage para Supabase

Se você tem dados no localStorage, execute no console:

```javascript
(async function() {
    const localData = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    console.log('Dados no localStorage:', localData.length);
    
    for (const p of localData) {
        try {
            await saveParticipant(p.nome, p.celular);
            console.log('✅ Migrado:', p.nome);
        } catch (e) {
            console.error('❌ Erro ao migrar:', p.nome, e);
        }
    }
})();
```

## Próximos Passos

Após verificar os logs, me informe:
1. O que aparece no console?
2. Há erros específicos?
3. Quantos participantes aparecem?

