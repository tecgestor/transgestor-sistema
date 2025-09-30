const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// JWT Secret (use uma chave mais segura em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_transgestor_2025';

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Dados em memória (substituir por banco de dados em produção)
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
                despesas: true, pagamentos: true, bancos: true, usuarios: true, perfis: true
            }
        },
        {
            id: 2,
            nome: "Financeiro",
            permissoes: {
                dashboard: true, veiculos: false, motoristas: false, viagens: false,
                despesas: true, pagamentos: true, bancos: true, usuarios: false, perfis: false
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
            data: "2025-04-28",
            motoristaId: 1,
            veiculoId: 1,
            origem: "VRS",
            destino: "Brasília",
            peso: 39.8,
            freteTotal: 8211.84,
            status: "finalizada"
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
            veiculoId: 1,
            status: "pendente"
        }
    ],
    receitas: [
        {
            id: 1,
            descricao: "Frete VRS-Brasília",
            valor: 8211.84,
            dataPrevisao: "2025-09-30",
            status: "recebido"
        }
    ],
    pagamentos: [],
    bancos: [
        {
            id: 1,
            nome: "Banco do Brasil",
            agencia: "1234",
            conta: "56789-0",
            saldo: 50000.00,
            status: "ativo"
        }
    ]
};

let nextId = 100; // ID sequencial

// === ROTAS DE AUTENTICAÇÃO ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

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
                perfilId: usuario.perfilId 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

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
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// === ROTAS PROTEGIDAS ===

// Usuários
app.get('/api/usuarios', authenticateToken, (req, res) => {
    const usuariosSemSenha = dados.usuarios.map(({ senha, ...usuario }) => usuario);
    res.json(usuariosSemSenha);
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        const { nome, email, senha, perfilId } = req.body;
        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = {
            id: nextId++,
            nome,
            email,
            senha: senhaHash,
            perfilId: parseInt(perfilId),
            ativo: true,
            dataCadastro: new Date().toISOString()
        };

        dados.usuarios.push(novoUsuario);

        const { senha: _, ...usuarioSemSenha } = novoUsuario;
        res.status(201).json(usuarioSemSenha);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Perfis
app.get('/api/perfis', authenticateToken, (req, res) => {
    res.json(dados.perfis);
});

app.post('/api/perfis', authenticateToken, (req, res) => {
    const novoPerfil = {
        id: nextId++,
        ...req.body
    };
    dados.perfis.push(novoPerfil);
    res.status(201).json(novoPerfil);
});

// Veículos
app.get('/api/veiculos', authenticateToken, (req, res) => {
    res.json(dados.veiculos);
});

app.post('/api/veiculos', authenticateToken, (req, res) => {
    const novoVeiculo = {
        id: nextId++,
        ...req.body
    };
    dados.veiculos.push(novoVeiculo);
    res.status(201).json(novoVeiculo);
});

// Motoristas
app.get('/api/motoristas', authenticateToken, (req, res) => {
    res.json(dados.motoristas);
});

app.post('/api/motoristas', authenticateToken, (req, res) => {
    const novoMotorista = {
        id: nextId++,
        ...req.body
    };
    dados.motoristas.push(novoMotorista);
    res.status(201).json(novoMotorista);
});

// Viagens
app.get('/api/viagens', authenticateToken, (req, res) => {
    res.json(dados.viagens);
});

app.post('/api/viagens', authenticateToken, (req, res) => {
    const novaViagem = {
        id: nextId++,
        ...req.body
    };
    dados.viagens.push(novaViagem);
    res.status(201).json(novaViagem);
});

// Despesas
app.get('/api/despesas', authenticateToken, (req, res) => {
    res.json(dados.despesas);
});

app.post('/api/despesas', authenticateToken, (req, res) => {
    const novaDespesa = {
        id: nextId++,
        status: 'pendente',
        ...req.body
    };
    dados.despesas.push(novaDespesa);
    res.status(201).json(novaDespesa);
});

// Receitas
app.get('/api/receitas', authenticateToken, (req, res) => {
    res.json(dados.receitas);
});

app.post('/api/receitas', authenticateToken, (req, res) => {
    const novaReceita = {
        id: nextId++,
        status: 'pendente',
        ...req.body
    };
    dados.receitas.push(novaReceita);
    res.status(201).json(novaReceita);
});

// Pagamentos
app.get('/api/pagamentos', authenticateToken, (req, res) => {
    res.json(dados.pagamentos);
});

app.post('/api/pagamentos', authenticateToken, (req, res) => {
    const { despesaId, bancoId, dataPagamento, observacoes } = req.body;

    // Atualizar despesa para "pago"
    const despesa = dados.despesas.find(d => d.id === parseInt(despesaId));
    if (despesa) {
        despesa.status = 'pago';
        despesa.dataPagamento = dataPagamento;
        despesa.bancoId = parseInt(bancoId);
    }

    const novoPagamento = {
        id: nextId++,
        despesaId: parseInt(despesaId),
        bancoId: parseInt(bancoId),
        valor: despesa ? despesa.valor : 0,
        dataPagamento,
        observacoes,
        dataRegistro: new Date().toISOString()
    };

    dados.pagamentos.push(novoPagamento);
    res.status(201).json(novoPagamento);
});

// Bancos
app.get('/api/bancos', authenticateToken, (req, res) => {
    res.json(dados.bancos);
});

app.post('/api/bancos', authenticateToken, (req, res) => {
    const novoBanco = {
        id: nextId++,
        status: 'ativo',
        ...req.body
    };
    dados.bancos.push(novoBanco);
    res.status(201).json(novoBanco);
});

// Relatórios
app.get('/api/relatorios/dashboard', authenticateToken, (req, res) => {
    const totalReceitas = dados.receitas.reduce((sum, r) => r.status === 'recebido' ? sum + r.valor : sum, 0);
    const totalDespesas = dados.despesas.reduce((sum, d) => d.status === 'pago' ? sum + d.valor : sum, 0);
    const despesasPendentes = dados.despesas.filter(d => d.status === 'pendente').length;
    const receitasPendentes = dados.receitas.filter(r => r.status === 'pendente').length;

    res.json({
        totalReceitas,
        totalDespesas,
        saldoLiquido: totalReceitas - totalDespesas,
        despesasPendentes,
        receitasPendentes,
        totalViagens: dados.viagens.length,
        viagensAndamento: dados.viagens.filter(v => v.status === 'andamento').length
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'TransGestor Backend'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: '🚛 TransGestor Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            login: '/api/auth/login',
            dashboard: '/api/relatorios/dashboard'
        }
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚛 TransGestor Backend rodando na porta ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET ? 'Configurado' : 'Usando padrão'}`);
});

module.exports = app;
