# Como Enviar para o GitHub 🚀

## Passo a Passo

### 1. Configurar Git (se ainda não configurou)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 2. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `sorteio-webinar-iphone` (ou o nome que preferir)
3. Escolha: **Público** ou **Privado**
4. **NÃO** marque "Initialize this repository with a README"
5. Clique em **"Create repository"**

### 3. Conectar e Enviar o Código

Após criar o repositório, você verá instruções. Execute estes comandos no terminal:

```bash
cd /Users/viniciusornelas/sorteio/Sorteiopro01

# Adicionar o remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/sorteio-webinar-iphone.git

# Ou se preferir usar SSH:
# git remote add origin git@github.com:SEU_USUARIO/sorteio-webinar-iphone.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

### 4. Se pedir autenticação

- Se usar HTTPS: será necessário um Personal Access Token
  - Vá em: GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
  - Crie um novo token com permissão `repo`
  - Use esse token como senha quando pedir

- Se usar SSH: configure suas chaves SSH no GitHub

### 5. Verificar

Acesse seu repositório no GitHub e você verá todos os arquivos lá!

---

## Comandos Úteis

### Ver status dos arquivos
```bash
git status
```

### Adicionar mudanças futuras
```bash
git add .
git commit -m "Descrição da mudança"
git push
```

### Ver histórico de commits
```bash
git log
```

---

## Deploy (Opcional)

Para colocar online gratuitamente, você pode usar:

- **Vercel**: https://vercel.com
  - Conecte seu repositório do GitHub
  - Deploy automático!

- **Netlify**: https://netlify.com
  - Arraste a pasta ou conecte o GitHub
  - Deploy em segundos!

- **GitHub Pages**: Gratuito e integrado
  - Settings > Pages > Escolha a branch `main`
  - Seu site estará em: `https://SEU_USUARIO.github.io/sorteio-webinar-iphone`

