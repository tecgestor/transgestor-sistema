# 🚛 TransGestor v3.0 - Sistema Completo de Gestão para Transportadoras

Sistema avançado de gestão para empresas de transporte rodoviário com funcionalidades completas de edição, logs, filtros e análises gráficas.

## 🚀 Novas Funcionalidades v3.0

### 📝 Sistema de Logs Completo
- **Auditoria Total**: Todos os CRUDs são registrados com usuário, data/hora
- **Rastreabilidade**: Histórico completo de alterações em todas as entidades
- **Controle de Acesso**: Logs por usuário e tipo de operação
- **Dados Antigos**: Backup automático do estado anterior nas edições

### ✏️ Edição Avançada
- **Pré-preenchimento**: Dados carregados automaticamente para edição
- **Validação**: Regras de negócio específicas por tipo de registro
- **Controle de Status**: Viagens finalizadas só editáveis por Admin
- **Cálculos Automáticos**: Recalculo de saldos em tempo real

### 👁️ Sistema de Visualização
- **Modal "Ver"**: Visualização completa sem edição
- **Detalhamento**: Informações organizadas por seções
- **Formato Específico**: Layout otimizado para cada tipo de dados
- **Histórico**: Incluindo datas de pagamento/recebimento/finalização

### 🔍 Filtros Avançados
- **Viagens**: Por motorista, veículo, data, status
- **Despesas**: Por tipo, nota fiscal, veículo, vencimento, status
- **Receitas**: Por descrição, data previsão, status
- **Busca Inteligente**: Filtros parciais e combinados
- **Limpeza Rápida**: Botão para resetar todos os filtros

### 📊 Dashboard com Gráficos
- **Análise por Período**: Filtro de datas para análises específicas
- **Receitas por Veículo**: Gráfico de barras comparativo
- **Despesas por Veículo**: Análise de custos por caminhão
- **Receitas por Motorista**: Performance individual dos motoristas
- **Resultado Líquido**: Comparação receita vs despesa por veículo

### 🏁 Controle de Viagens
- **Finalização**: Status e data de finalização
- **Bloqueio de Edição**: Viagens finalizadas protegidas (exceto Admin)
- **Rastreamento**: Histórico completo do ciclo da viagem

### 💳 Gestão de Pagamentos
- **Baixa de Despesas**: Registro automático de pagamentos
- **Estorno**: Reversão de pagamentos com log completo
- **Histórico**: Todas as movimentações registradas
- **Controle Bancário**: Vinculação com contas cadastradas

## 🛠 Tecnologias

### Frontend Avançado
- **HTML5** - Estrutura semântica completa
- **CSS3** - Design responsivo com grid e flexbox
- **JavaScript ES6+** - Funcionalidades avançadas, async/await
- **LocalStorage** - Persistência local para demonstrações
- **Modal System** - Criação dinâmica de formulários

### Backend Robusto
- **Node.js** - Runtime do servidor
- **Express** - Framework web otimizado
- **JWT** - Autenticação segura
- **bcryptjs** - Criptografia de senhas
- **PostgreSQL** - Banco de dados relacional (produção)

## 📱 Funcionalidades Principais

### 🚛 Gestão de Viagens (Baseada no Envelope Original)
- **Formulário Completo**: Exatamente igual ao envelope físico
- **Cálculos Automáticos**: 
  - Frete Total = Peso × Valor por Tonelada
  - Total Despesas = Abastecimentos + ARLA + Pedágio + Outras
  - Saldo Envelope = Frete Total - Total Despesas
- **Abastecimentos**: Até 3 postos com detalhes completos
- **ARLA**: Controle específico de ARLA
- **Finalização**: Controle de status e data de conclusão
- **Restrições**: Viagens finalizadas não podem ser alteradas (exceto Admin)

### 💰 Gestão Financeira Completa
- **Receitas**: Controle de recebimentos com status
- **Despesas**: Lançamento e controle de vencimentos
- **Pagamentos**: Baixa automática com registro
- **Estornos**: Reversão de pagamentos com auditoria
- **Análises**: Gráficos por veículo, motorista e período

### 👥 Controle de Usuários
- **Perfis**: Administrador, Financeiro, Operacional
- **Permissões**: Controle granular de acesso por tela
- **Logs**: Rastreamento de todas as ações por usuário
- **Sessões**: Controle de login/logout com JWT

## 🔧 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/transgestor-v3.git
cd transgestor-v3
```

### 2. Frontend (Vercel)
- Faça upload de todos os arquivos para o repositório GitHub
- Conecte o repositório no Vercel
- Deploy automático a cada commit

### 3. Backend (Render.com)
```bash
# Configurar variáveis de ambiente:
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_super_forte
DATABASE_URL=postgresql://usuario:senha@host:porta/database
FRONTEND_URL=https://seu-frontend.vercel.app
```

### 4. Configuração da API
Edite o arquivo `app.js`, linha 2:
```javascript
const API_BASE_URL = 'https://seu-backend.onrender.com/api';
```

## 📋 Como Usar

### Login
- **Admin**: admin@empresa.com / 123 (Acesso total)
- **Financeiro**: financeiro@empresa.com / 123 (Apenas financeiro)

### Navegação
1. **Dashboard**: Visão geral + gráficos por período
2. **Viagens**: CRUD completo + envelope + finalização
3. **Despesas**: CRUD + filtros + baixa/estorno
4. **Receitas**: CRUD + filtros + recebimento
5. **Pagamentos**: Baixa de despesas + estornos
6. **Outros**: Veículos, motoristas, bancos, usuários, perfis

### Operações Principais
- **➕ Adicionar**: Criar novos registros
- **👁️ Ver**: Visualizar dados completos (somente leitura)
- **✏️ Editar**: Alterar dados existentes (com log)
- **🗑️ Excluir**: Remover registros (com confirmação)
- **💳 Baixar**: Pagar despesas
- **↩️ Estornar**: Reverter pagamentos
- **🔍 Filtrar**: Buscar registros específicos

### Análises e Gráficos
1. Acesse o **Dashboard**
2. Configure o **período de análise**
3. Clique em **"Atualizar Gráficos"**
4. Analise:
   - Receitas por veículo
   - Despesas por veículo  
   - Receitas por motorista
   - Resultado líquido comparativo

## 🔐 Segurança e Logs

### Sistema de Auditoria
- **CREATE**: Registro de novos itens
- **UPDATE**: Alterações com dados antigos/novos
- **DELETE**: Exclusões com backup
- **VIEW**: Visualizações registradas
- **LOGIN/LOGOUT**: Controle de acesso

### Controle de Permissões
- **Administrador**: Acesso total, pode editar viagens finalizadas
- **Financeiro**: Apenas módulos financeiros
- **Operacional**: Apenas operações (futuro)

## 📊 Relatórios e KPIs

### Dashboard Principal
- **Receita Total**: Soma de receitas recebidas
- **Despesas Total**: Soma de despesas pagas
- **Saldo Líquido**: Receitas - Despesas
- **Margem Líquida**: (Saldo ÷ Receitas) × 100

### Gráficos Analíticos
- **Por Veículo**: Performance individual de cada caminhão
- **Por Motorista**: Receitas geradas por cada motorista
- **Por Período**: Análise temporal configurável
- **Comparativo**: Receitas vs Despesas vs Resultado

## 🎯 Vantagens do Sistema

### Para a Empresa
- **Controle Total**: Todos os dados centralizados
- **Análises Avançadas**: Gráficos para tomada de decisão
- **Auditoria Completa**: Histórico de todas as alterações
- **Mobilidade**: Acesso via celular/tablet

### Para o Motorista
- **Envelope Digital**: Familiar ao processo físico
- **Transparência**: Visualização do saldo em tempo real
- **Simplicidade**: Interface intuitiva e responsiva

### Para o Financeiro
- **Controle de Pagamentos**: Baixa e estorno facilitados
- **Relatórios**: Análises por período e critério
- **Conciliação**: Controle bancário integrado

## 📁 Estrutura de Arquivos

```
transgestor-v3.0/
├── index.html          # Interface principal com filtros
├── style.css           # Estilos completos + gráficos + modais
├── app.js              # JavaScript completo (73.000+ linhas)
├── vercel.json         # Configuração SPA
├── server.js           # Backend Node.js com logs
├── package.json        # Dependências backend
└── README.md           # Esta documentação
```

## 🚀 Próximas Versões

### v3.1 - Planejado
- [ ] Relatórios em PDF
- [ ] Integração contábil
- [ ] Backup automático
- [ ] Notificações push

### v3.2 - Futuro
- [ ] App mobile nativo
- [ ] Integração GPS
- [ ] BI avançado
- [ ] Multi-empresa

---

**TransGestor v3.0** - O sistema mais completo para gestão de transportadoras! 🚛✨

**Versão**: 3.0.0  
**Data**: Setembro 2025  
**Desenvolvido**: Sistema Completo com Logs, Edição, Filtros e Gráficos
