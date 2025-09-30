const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'transgestor_v3_super_secret_key_2025';

// Middleware de segurança
app.use(helmet());
app.use(morgan('combined'));

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
};

// Dados em memória (substituir por PostgreSQL em produção)
let dados = {
    usuarios: [
        {
            id: 1,
            nome: "Administrador",
            email: "admin@empresa.com",
            senha: bcrypt.hashSync("123", 10),
            perfilId: 1,
            ativo: true,
            dataCadastro: new Date().toISOString()
        },
        {
            id: 2,
            nome: "Financeiro", 
            email: "financeiro@empresa.com",
            senha: bcrypt.hashSync("123", 10),
            perfilId: 2,
            ativo: true,
            dataCadastro: new Date().toISOString()
        }
    ],
    perfis: [
        {
            id: 1,
            nome: "Administrador",
            permissoes: {
                dashboard: true, veiculos: true, motoristas: true, viagens: true,
                despesas: true, pagamentos: true, receitas: true, bancos: true, 
                usuarios: true, perfis: true
            }
        },
        {
            id: 2,
            nome: "Financeiro",
            permissoes: {
                dashboard: true, veiculos: false, motoristas: false, viagens: false,
                despesas: true, pagamentos: true, receitas: true, bancos: true, 
                usuarios: false, perfis: false
            }
        }
    ],
    veiculos: [
        {
            id: 1,
            placaCaminhao: "RXP-2674",
            placaCarreta: "ABC-1234", 
            modelo: "Volvo FH",
            ano: 2020,
            eixosCarreta: 3,
            status: "ativo"
        }
    ],
    motoristas: [
        {
            id: 1,
            nome: "Elias Rodrigues da Silva",
            cpf: "123.456.789-00",
            cnh: "12345678901", 
            telefone: "(14) 99999-9999",
            status: "ativo"
        }
    ],
    viagens: [
        {
            id: 1,
            dataViagem: "2025-04-28",
            motorista: "Elias Rodrigues da Silva",
            veiculo: "RXP-2674",
            placaCarreta: "ABC-1234",
            localCarga: "VRS",
            localDescarga: "Brasília", 
            kmInicio: 216780,
            kmFim: 217685,
            pesoSaida: 39.80,
            pesoChegada: 39.80,
            valorTonelada: 200.00,
            freteTotal: 8211.84,
            abastecimentos: [
                {posto: "FERNAND", km: 216780, litros: 404, valor: 903.20},
                {posto: "FERNAND", km: "", litros: 250, valor: 556.00}
            ],
            arla: {km: 216795, litros: 2.45, valor: 110.25},
            pedagioRetorno: 7.50,
            outrasDespesas: 10.00,
            saldoEnvelope: 3542.25,
            observacoes: "Conferir 250 litros Diesel - que está na NF até 560 ps AA",
            status: "finalizada",
            dataFinalizacao: "2025-04-30"
        }
    ],
    despesas: [
        {
            id: 1,
            tipo: "Combustível",
            numeroNota: "12345", 
            valor: 1500.00,
            dataRecebimento: "2025-09-20",
            dataVencimento: "2025-10-20",
            veiculo: "RXP-2674",
            status: "pago",
            dataPagamento: "2025-09-25"
        }
    ],
    receitas: [
        {
            id: 1,
            descricao: "Frete VRS-Brasília",
            valor: 8211.84,
            dataPrevisao: "2025-09-30",
            status: "recebido",
            dataRecebimento: "2025-09-28"
        }
    ],
    bancos: [
        {
            id: 1,
            nome: "Banco do Brasil",
            agencia: "1234",
            conta: "56789-0",
            saldo: 50000.00,
            status: "ativo"
        }
    ],
    pagamentos: [
        {
            id: 1,
            despesaId: 1,
            valor: 1500.00,
            dataPagamento: "2025-09-25",
            bancoId: 1,
            observacoes: "Pagamento combustível RXP-2674",
            usuarioId: 1
        }
    ],
    logs: [
        {
            id: 1,
            userId: 1,
            userName: "Administrador",
            action: "CREATE",
            entityType: "VIAGENS",
            entityId: 1,
            changes: {dataViagem: "2025-04-28", motorista: "Elias Rodrigues da Silva"},
            oldData: null,
            timestamp: "2025-09-29T10:00:00.000Z"
        }
    ]
};

let nextId = 100;

// === SISTEMA DE LOGS ===
function createLog(userId, userName, action, entityType, entityId, changes, oldData = null) {
    const log = {
        id: nextId++,
        userId,
        userName,
        action, // CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
        entityType,
        entityId,
        changes,
        oldData,
        timestamp: new Date().toISOString()
    };

    dados.logs.push(log);
    console.log(`📝 Log criado: ${action} ${entityType} ${entityId} por ${userName}`);
    return log;
}

// === ROTAS DE AUTENTICAÇÃO ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const usuario = dados.usuarios.find(u => u.email === email && u.ativo);
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const perfil = dados.perfis.find(p => p.id === usuario.perfilId);

        const token = jwt.sign(
            { 
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                perfilId: usuario.perfilId
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log do login
        createLog(usuario.id, usuario.nome, 'LOGIN', 'USER', usuario.id, { email }, null);

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfilId: usuario.perfilId,
                perfil: perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    createLog(req.user.id, req.user.nome, 'LOGOUT', 'USER', req.user.id, {}, null);
    res.json({ success: true, message: 'Logout realizado com sucesso' });
});

// === ROTAS CRUD GENÉRICAS COM LOGS ===

// GET - Listar
['veiculos', 'motoristas', 'viagens', 'despesas', 'receitas', 'bancos', 'usuarios', 'perfis', 'pagamentos'].forEach(entity => {
    app.get(`/api/${entity}`, authenticateToken, (req, res) => {
        const data = entity === 'usuarios' 
            ? dados[entity].map(({ senha, ...item }) => item)  // Remover senhas
            : dados[entity];
        res.json(data);
    });
});

// POST - Criar
['veiculos', 'motoristas', 'viagens', 'despesas', 'receitas', 'bancos', 'usuarios', 'perfis', 'pagamentos'].forEach(entity => {
    app.post(`/api/${entity}`, authenticateToken, async (req, res) => {
        try {
            const newItem = {
                id: nextId++,
                ...req.body,
                status: req.body.status || 'ativo'
            };

            // Hash senha para usuários
            if (entity === 'usuarios' && newItem.senha) {
                newItem.senha = await bcrypt.hash(newItem.senha, 10);
            }

            // Cálculos especiais para viagens
            if (entity === 'viagens') {
                newItem.freteTotal = parseFloat(newItem.pesoSaida) * parseFloat(newItem.valorTonelada);

                let totalDespesas = 0;
                if (newItem.abastecimentos) {
                    totalDespesas += newItem.abastecimentos.reduce((sum, ab) => sum + parseFloat(ab.valor || 0), 0);
                }
                if (newItem.arla) {
                    totalDespesas += parseFloat(newItem.arla.valor || 0);
                }
                totalDespesas += parseFloat(newItem.pedagioRetorno || 0);
                totalDespesas += parseFloat(newItem.outrasDespesas || 0);

                newItem.saldoEnvelope = newItem.freteTotal - totalDespesas;
            }

            dados[entity].push(newItem);

            // Log da criação
            const logData = { ...newItem };
            if (entity === 'usuarios') delete logData.senha;
            createLog(req.user.id, req.user.nome, 'CREATE', entity.toUpperCase(), newItem.id, logData, null);

            res.status(201).json(newItem);
        } catch (error) {
            console.error(`Erro ao criar ${entity}:`, error);
            res.status(500).json({ error: `Erro ao criar ${entity}` });
        }
    });
});

// PUT - Atualizar
['veiculos', 'motoristas', 'viagens', 'despesas', 'receitas', 'bancos', 'usuarios', 'perfis', 'pagamentos'].forEach(entity => {
    app.put(`/api/${entity}/:id`, authenticateToken, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const itemIndex = dados[entity].findIndex(item => item.id === id);

            if (itemIndex === -1) {
                return res.status(404).json({ error: `${entity} não encontrado` });
            }

            const oldItem = { ...dados[entity][itemIndex] };
            const updatedItem = { ...dados[entity][itemIndex], ...req.body };

            // Hash nova senha
            if (entity === 'usuarios' && req.body.senha) {
                updatedItem.senha = await bcrypt.hash(req.body.senha, 10);
            }

            // Recalcular viagens
            if (entity === 'viagens') {
                updatedItem.freteTotal = parseFloat(updatedItem.pesoSaida) * parseFloat(updatedItem.valorTonelada);

                let totalDespesas = 0;
                if (updatedItem.abastecimentos) {
                    totalDespesas += updatedItem.abastecimentos.reduce((sum, ab) => sum + parseFloat(ab.valor || 0), 0);
                }
                if (updatedItem.arla) {
                    totalDespesas += parseFloat(updatedItem.arla.valor || 0);
                }
                totalDespesas += parseFloat(updatedItem.pedagioRetorno || 0);
                totalDespesas += parseFloat(updatedItem.outrasDespesas || 0);

                updatedItem.saldoEnvelope = updatedItem.freteTotal - totalDespesas;
            }

            dados[entity][itemIndex] = updatedItem;

            // Log da atualização
            const logOldData = { ...oldItem };
            const logNewData = { ...updatedItem };
            if (entity === 'usuarios') {
                delete logOldData.senha;
                delete logNewData.senha;
            }
            createLog(req.user.id, req.user.nome, 'UPDATE', entity.toUpperCase(), id, logNewData, logOldData);

            res.json(updatedItem);
        } catch (error) {
            console.error(`Erro ao atualizar ${entity}:`, error);
            res.status(500).json({ error: `Erro ao atualizar ${entity}` });
        }
    });
});

// DELETE
['veiculos', 'motoristas', 'viagens', 'despesas', 'receitas', 'bancos', 'usuarios', 'perfis', 'pagamentos'].forEach(entity => {
    app.delete(`/api/${entity}/:id`, authenticateToken, (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const itemIndex = dados[entity].findIndex(item => item.id === id);

            if (itemIndex === -1) {
                return res.status(404).json({ error: `${entity} não encontrado` });
            }

            const deletedItem = { ...dados[entity][itemIndex] };
            dados[entity].splice(itemIndex, 1);

            // Log da exclusão
            const logData = { ...deletedItem };
            if (entity === 'usuarios') delete logData.senha;
            createLog(req.user.id, req.user.nome, 'DELETE', entity.toUpperCase(), id, {}, logData);

            res.json({ success: true, message: `${entity} excluído com sucesso` });
        } catch (error) {
            console.error(`Erro ao excluir ${entity}:`, error);
            res.status(500).json({ error: `Erro ao excluir ${entity}` });
        }
    });
});

// === ROTAS ESPECÍFICAS ===

// Pagamento de despesa
app.post('/api/despesas/:id/pagar', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const despesa = dados.despesas.find(d => d.id === id);

        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        const oldData = { ...despesa };

        despesa.status = 'pago';
        despesa.dataPagamento = new Date().toISOString().split('T')[0];

        // Criar registro de pagamento
        const pagamento = {
            id: nextId++,
            despesaId: id,
            valor: despesa.valor,
            dataPagamento: despesa.dataPagamento,
            bancoId: req.body.bancoId || 1,
            observacoes: req.body.observacoes || `Pagamento ${despesa.tipo}`,
            usuarioId: req.user.id
        };

        dados.pagamentos.push(pagamento);

        // Logs
        createLog(req.user.id, req.user.nome, 'UPDATE', 'DESPESAS', id, despesa, oldData);
        createLog(req.user.id, req.user.nome, 'CREATE', 'PAGAMENTOS', pagamento.id, pagamento, null);

        res.json({ success: true, despesa, pagamento });
    } catch (error) {
        console.error('Erro ao pagar despesa:', error);
        res.status(500).json({ error: 'Erro ao pagar despesa' });
    }
});

// Estorno de pagamento
app.post('/api/despesas/:id/estornar', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const despesa = dados.despesas.find(d => d.id === id);
        const pagamento = dados.pagamentos.find(p => p.despesaId === id);

        if (!despesa || !pagamento) {
            return res.status(404).json({ error: 'Despesa ou pagamento não encontrado' });
        }

        const oldDespesa = { ...despesa };
        const oldPagamento = { ...pagamento };

        // Reverter despesa
        despesa.status = 'pendente';
        delete despesa.dataPagamento;

        // Remover pagamento
        const pagamentoIndex = dados.pagamentos.findIndex(p => p.id === pagamento.id);
        dados.pagamentos.splice(pagamentoIndex, 1);

        // Logs
        createLog(req.user.id, req.user.nome, 'UPDATE', 'DESPESAS', id, despesa, oldDespesa);
        createLog(req.user.id, req.user.nome, 'DELETE', 'PAGAMENTOS', pagamento.id, {}, oldPagamento);

        res.json({ success: true, message: 'Pagamento estornado com sucesso' });
    } catch (error) {
        console.error('Erro ao estornar pagamento:', error);
        res.status(500).json({ error: 'Erro ao estornar pagamento' });
    }
});

// Receber receita
app.post('/api/receitas/:id/receber', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const receita = dados.receitas.find(r => r.id === id);

        if (!receita) {
            return res.status(404).json({ error: 'Receita não encontrada' });
        }

        const oldData = { ...receita };

        receita.status = 'recebido';
        receita.dataRecebimento = new Date().toISOString().split('T')[0];

        createLog(req.user.id, req.user.nome, 'UPDATE', 'RECEITAS', id, receita, oldData);

        res.json({ success: true, receita });
    } catch (error) {
        console.error('Erro ao receber receita:', error);
        res.status(500).json({ error: 'Erro ao receber receita' });
    }
});

// Logs de auditoria
app.get('/api/logs', authenticateToken, (req, res) => {
    const { page = 1, limit = 50, entityType, action, userId } = req.query;

    let filteredLogs = dados.logs;

    if (entityType) {
        filteredLogs = filteredLogs.filter(log => log.entityType === entityType);
    }

    if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === parseInt(userId));
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
        logs: paginatedLogs,
        total: filteredLogs.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredLogs.length / limit)
    });
});

// Dashboard com métricas
app.get('/api/relatorios/dashboard', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;

    let viagensFiltradas = dados.viagens;
    let despesasFiltradas = dados.despesas;
    let receitasFiltradas = dados.receitas;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        viagensFiltradas = dados.viagens.filter(v => {
            const dataViagem = new Date(v.dataViagem);
            return dataViagem >= start && dataViagem <= end;
        });

        despesasFiltradas = dados.despesas.filter(d => {
            const dataVenc = new Date(d.dataVencimento);
            return dataVenc >= start && dataVenc <= end;
        });

        receitasFiltradas = dados.receitas.filter(r => {
            const dataPrev = new Date(r.dataPrevisao);
            return dataPrev >= start && dataPrev <= end;
        });
    }

    const totalReceitas = receitasFiltradas.reduce((sum, r) => r.status === 'recebido' ? sum + r.valor : sum, 0);
    const totalDespesas = despesasFiltradas.reduce((sum, d) => d.status === 'pago' ? sum + d.valor : sum, 0);
    const despesasPendentes = despesasFiltradas.filter(d => d.status === 'pendente').length;
    const receitasPendentes = receitasFiltradas.filter(r => r.status === 'pendente').length;

    // Dados por veículo
    const dadosPorVeiculo = {};
    viagensFiltradas.forEach(v => {
        if (!dadosPorVeiculo[v.veiculo]) {
            dadosPorVeiculo[v.veiculo] = { receitas: 0, despesas: 0 };
        }
        dadosPorVeiculo[v.veiculo].receitas += v.freteTotal || 0;
    });

    despesasFiltradas.filter(d => d.status === 'pago').forEach(d => {
        if (!dadosPorVeiculo[d.veiculo]) {
            dadosPorVeiculo[d.veiculo] = { receitas: 0, despesas: 0 };
        }
        dadosPorVeiculo[d.veiculo].despesas += d.valor;
    });

    // Dados por motorista
    const dadosPorMotorista = {};
    viagensFiltradas.forEach(v => {
        if (!dadosPorMotorista[v.motorista]) {
            dadosPorMotorista[v.motorista] = { receitas: 0, viagens: 0 };
        }
        dadosPorMotorista[v.motorista].receitas += v.freteTotal || 0;
        dadosPorMotorista[v.motorista].viagens += 1;
    });

    res.json({
        kpis: {
            totalReceitas,
            totalDespesas,
            saldoLiquido: totalReceitas - totalDespesas,
            margem: totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0,
            despesasPendentes,
            receitasPendentes,
            totalViagens: viagensFiltradas.length,
            viagensAndamento: viagensFiltradas.filter(v => v.status === 'andamento').length
        },
        dadosPorVeiculo,
        dadosPorMotorista,
        periodo: { startDate, endDate }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        service: 'TransGestor Backend v3.0 - Sistema Completo com Logs',
        features: [
            'Sistema de Logs Completo',
            'Auditoria Total',
            'Gestão de Viagens com Envelope',
            'Controle de Pagamentos e Estornos',
            'Dashboard com Gráficos',
            'Filtros Avançados',
            'Análises por Período'
        ]
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: '🚛 TransGestor Backend API v3.0',
        version: '3.0.0',
        features: [
            '📝 Sistema de Logs Completo',
            '✏️ Edição com Pré-preenchimento', 
            '👁️ Modais de Visualização',
            '🔍 Filtros Avançados',
            '📊 Dashboard com Gráficos',
            '🏁 Controle de Viagens',
            '💳 Gestão de Pagamentos/Estornos'
        ],
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/login',
            dashboard: '/api/relatorios/dashboard',
            logs: '/api/logs',
            entities: ['veiculos', 'motoristas', 'viagens', 'despesas', 'receitas', 'bancos', 'usuarios', 'perfis', 'pagamentos']
        },
        database: 'In-Memory (Demo) - PostgreSQL em produção'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚛 TransGestor Backend v3.0 rodando na porta ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.length > 20 ? 'Configurado (Seguro)' : 'Padrão (Desenvolvimento)'}`);
    console.log(`📝 Sistema de Logs: Ativo`);
    console.log(`📊 Dashboard Analytics: Disponível`);
    console.log(`🔍 Sistema de Filtros: Implementado`);
    console.log(`💳 Pagamentos/Estornos: Funcional`);
    console.log(`🏁 Controle de Viagens: Envelope Completo`);
});

module.exports = app;
