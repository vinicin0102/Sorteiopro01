# Sistema de Webinar e Sorteio - iPhone 🎉

Sistema completo de webinar com página de inscrição, transmissão ao vivo com chat, e painel administrativo para gerenciar sorteio de iPhone.

## 🎯 Funcionalidades

### Homepage de Inscrição (`index.html`)
- ✅ Formulário de inscrição com nome e celular
- ✅ Validação de campos e máscara automática para celular
- ✅ Editor personalizável pelo admin
- ✅ Salva participantes em lista global
- ✅ Detecta dispositivo (mobile/desktop)

### Página do Webinar (`webinar.html`)
- ✅ Player de vídeo integrado (YouTube)
- ✅ Chat ao vivo com comentários controlados pelo admin
- ✅ Indicador "AO VIVO" com animação pulsante
- ✅ Contador de visualizadores oscilando (inicia em 1.000)
- ✅ Timer de duração da transmissão
- ✅ Comentários de interação e negação sobre sorteio
- ✅ Interface responsiva

### Painel Administrativo (`admin.html`)
- ✅ **Login protegido por senha**
- ✅ **Editor de Formulário**: Personalize título, subtítulo, horário, etc.
- ✅ **Editor de Comentários**: Crie comentários de interação e negação
- ✅ **Lista de Participantes**: Veja todos os cadastrados (mobile e desktop)
- ✅ **Seleção de Ganhadores**: Escolha um ou mais ganhadores do sorteio
- ✅ Estatísticas de participantes
- ✅ Busca de participantes

## 🔐 Acesso Admin

**URL**: `http://localhost:8000/admin.html`

**Senha padrão**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha no arquivo `admin.js` (linha 1) antes de usar em produção!

## 📁 Estrutura de Arquivos

```
Sorteiopro01/
├── index.html          # Homepage de inscrição
├── homepage.css        # Estilos da homepage
├── homepage.js         # Script da homepage
├── webinar.html        # Página do webinar ao vivo
├── styles.css          # Estilos do webinar
├── script.js           # Funcionalidades do webinar
├── admin.html          # Painel administrativo
├── admin.css           # Estilos do admin
├── admin.js            # Lógica do admin
└── README.md           # Este arquivo
```

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
python3 -m http.server 8000
```

Ou acesse diretamente via: `http://localhost:8000`

### 2. Configurar como Admin

1. Acesse `http://localhost:8000/admin.html`
2. Digite a senha: `admin123`
3. Personalize o formulário, comentários, etc.

### 3. Para Usuários

1. Acesse `http://localhost:8000` (homepage)
2. Preencha nome e celular
3. Seja redirecionado para o webinar

## ⚙️ Funcionalidades do Admin

### Editor de Formulário
- Edite título principal, subtítulo
- Altere texto do destaque
- Configure horário da aula
- Alterações aparecem imediatamente na homepage

### Editor de Comentários
**Comentários de Interação** (Positivos):
- Aumentam engajamento
- Ex: "Que sorteio incrível! Quero muito ganhar esse iPhone!"

**Comentários de Negação** (Pressão):
- Criam urgência
- Ex: "Espero que não seja sorteio fake como os outros..."

### Participantes
- Lista completa de todos os cadastrados
- Mostra nome, celular e data/hora
- Estatísticas: Total e cadastros do dia
- Detecta dispositivo (mobile/desktop)

### Selecionar Ganhadores
- Busque por nome ou celular
- Selecione múltiplos ganhadores
- Confirme os ganhadores
- Dados salvos no localStorage

## 🔧 Personalização

### Alterar Senha do Admin

No arquivo `admin.js`, linha 1:
```javascript
const ADMIN_PASSWORD = 'sua_senha_aqui';
```

### Alterar URL do Vídeo do YouTube

No arquivo `webinar.html`, linha 22-24:
```html
<iframe 
    id="youtube-player"
    src="https://www.youtube.com/embed/SEU_VIDEO_ID?autoplay=1&mute=0&controls=1"
    ...
```

### Personalizar Cores e Estilos

- Homepage: `homepage.css`
- Webinar: `styles.css`
- Admin: `admin.css`

## 💾 Armazenamento de Dados

O sistema usa **localStorage** do navegador para armazenar:
- `webinar_participantes`: Lista de todos os participantes
- `webinar_registration`: Registro individual atual
- `webinar_winners`: Ganhadores selecionados
- `admin_form_data`: Dados do formulário editados
- `admin_comentarios`: Comentários configurados
- `admin_logged_in`: Status de login do admin

⚠️ **Nota**: Em produção, substitua localStorage por um banco de dados real (MySQL, MongoDB, etc.)

## 📱 Responsividade

Todas as páginas são totalmente responsivas e funcionam em:
- 📱 Mobile (iPhone, Android)
- 💻 Desktop
- 📲 Tablet

## 🎨 Próximas Melhorias

- [ ] Integração com banco de dados real
- [ ] Sistema de WebSocket para chat em tempo real
- [ ] Envio de dados para servidor/API
- [ ] Notificações push
- [ ] Dashboard com gráficos
- [ ] Exportação de participantes (CSV/Excel)
- [ ] Sistema de sorteio automático

## 📝 Notas Importantes

1. **Senha do Admin**: Mude antes de usar em produção!
2. **Dados**: Atualmente salva no localStorage (apenas no navegador)
3. **Chat**: Comentários são simulados (não é chat real em tempo real)
4. **Sorteio**: Sistema permite escolher ganhadores manualmente

## 🆘 Suporte

Para dúvidas ou problemas, verifique:
1. Console do navegador (F12) para erros
2. Se o servidor está rodando na porta 8000
3. Se os arquivos estão todos na mesma pasta