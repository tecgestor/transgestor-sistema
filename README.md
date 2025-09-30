# 🚛 TransGestor - Sistema de Gestão para Transportadora

Sistema completo de gestão para empresas de transporte rodoviário, desenvolvido com tecnologias web modernas.

## 🚀 Funcionalidades

### 👥 Controle de Acesso
- Sistema de login com perfis de usuário
- Controle de permissões por tela
- Perfis: Administrador, Financeiro, Operacional

### 📊 Gestão Operacional
- **Veículos**: Cadastro completo com placas e especificações
- **Motoristas**: Dados pessoais, CNH e documentação
- **Viagens**: Controle de origem, destino, frete e status
- **Despesas**: Lançamento com controle de vencimento
- **Receitas**: Controle de recebimentos (envelopes, cartas frete)
- **Pagamentos**: Liquidação de despesas por conta bancária

### 🏦 Gestão Financeira
- Dashboard com KPIs financeiros
- Controle de contas bancárias
- Relatórios de receitas e despesas
- Margem de lucro por viagem
- Despesas pendentes e pagas

## 🛠 Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo e moderno
- **JavaScript** - Lógica da aplicação (Vanilla JS)
- **SPA** - Single Page Application

### Backend (Opcional)
- **Node.js** - Runtime do servidor
- **Express** - Framework web
- **JWT** - Autenticação
- **PostgreSQL** - Banco de dados

## 🌐 Deploy

### Frontend (Vercel)
```bash
git clone seu-repositorio
cd transgestor
# Upload para Vercel via GitHub
```

### Backend (Render.com)
```bash
# Configurar variáveis de ambiente:
NODE_ENV=production
JWT_SECRET=sua_chave_secreta
DATABASE_URL=sua_url_postgresql
```

## 📱 Uso

### Login
- **Administrador**: admin@empresa.com / 123
- **Financeiro**: financeiro@empresa.com / 123

### Navegação
- Interface 100% responsiva
- Menu adaptável para mobile
- Navegação por abas/seções

## 🔧 Configuração

### API Backend
Edite a variável `API_BASE_URL` no arquivo `app.js`:
```javascript
const API_BASE_URL = 'https://seu-backend.onrender.com/api';
```

### Modo Demonstração
O sistema funciona com dados locais para demonstração, mesmo sem backend conectado.

## 📋 Estrutura de Arquivos

```
transgestor/
├── index.html          # Interface principal
├── style.css           # Estilos responsivos
├── app.js              # JavaScript principal
├── vercel.json         # Configuração SPA
├── server.js           # Backend Node.js
├── package.json        # Dependências backend
└── README.md           # Esta documentação
```

## 🎯 Roadmap

- [x] Sistema de login e permissões
- [x] Interface responsiva
- [x] CRUD básico de todas entidades
- [x] Dashboard financeiro
- [x] Sistema de modais
- [ ] Integração completa com backend
- [ ] Exportação de relatórios PDF
- [ ] Sistema de notificações
- [ ] Backup automático de dados

## 📞 Suporte

Sistema desenvolvido para gestão completa de transportadoras, com foco em:
- Controle financeiro detalhado
- Gestão operacional eficiente
- Interface intuitiva para uso mobile
- Relatórios gerenciais completos

---

**Versão**: 1.0.0  
**Licença**: MIT  
**Desenvolvido**: 2025
