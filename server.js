const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const perfilRoutes = require('./routes/perfis');
const veiculoRoutes = require('./routes/veiculos');
const motoristaRoutes = require('./routes/motoristas');
const viagemRoutes = require('./routes/viagens');
const despesaRoutes = require('./routes/despesas');
const pagamentoRoutes = require('./routes/pagamentos');
const receitaRoutes = require('./routes/receitas');
const bancoRoutes = require('./routes/bancos');
const relatorioRoutes = require('./routes/relatorios');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfis', perfilRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/motoristas', motoristaRoutes);
app.use('/api/viagens', viagemRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/relatorios', relatorioRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚛 TransGestor Backend rodando na porta ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});