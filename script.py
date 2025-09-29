# Vou criar a estrutura completa da aplicação para deploy no Render.com
import os
import json

# Estrutura de arquivos para o projeto
project_structure = {
    "backend": {
        "package.json": {
            "name": "transgestor-backend",
            "version": "1.0.0",
            "description": "Sistema de Gestão para Transportadora - Backend",
            "main": "server.js",
            "scripts": {
                "start": "node server.js",
                "dev": "nodemon server.js"
            },
            "dependencies": {
                "express": "^4.18.2",
                "cors": "^2.8.5",
                "bcryptjs": "^2.4.3",
                "jsonwebtoken": "^9.0.0",
                "pg": "^8.11.0",
                "dotenv": "^16.0.3"
            },
            "devDependencies": {
                "nodemon": "^2.0.22"
            },
            "engines": {
                "node": "18.x"
            }
        },
        "server.js": '''const express = require('express');
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
});''',
        ".env.example": '''# Configurações do Servidor
PORT=10000
NODE_ENV=production

# URLs
FRONTEND_URL=https://seu-frontend.vercel.app

# Banco de dados PostgreSQL
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=24h

# Email (opcional para recuperação de senha)
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
'''
    },
    "frontend": {
        "vercel.json": {
            "version": 2,
            "builds": [
                {
                    "src": "*.html",
                    "use": "@vercel/static"
                }
            ],
            "routes": [
                {
                    "src": "/(.*)",
                    "dest": "/index.html"
                }
            ]
        }
    }
}

print("=== ESTRUTURA DO PROJETO TRANSGESTOR ===")
print("\n📁 BACKEND (Node.js + Express + PostgreSQL)")
print("├── package.json")
print("├── server.js")
print("├── .env.example")
print("├── routes/")
print("│   ├── auth.js")
print("│   ├── usuarios.js")
print("│   ├── perfis.js")
print("│   ├── viagens.js")
print("│   ├── despesas.js")
print("│   ├── pagamentos.js")
print("│   ├── receitas.js")
print("│   └── relatorios.js")
print("└── public/ (frontend files)")

print("\n📁 FRONTEND (HTML + CSS + JavaScript)")
print("├── index.html")
print("├── app.js")
print("├── style.css")
print("└── vercel.json")

# Salvar arquivos importantes
with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(project_structure["backend"]["package.json"], f, indent=2, ensure_ascii=False)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(project_structure["backend"]["server.js"])

with open('.env.example', 'w', encoding='utf-8') as f:
    f.write(project_structure["backend"][".env.example"])

with open('vercel.json', 'w', encoding='utf-8') as f:
    json.dump(project_structure["frontend"]["vercel.json"], f, indent=2, ensure_ascii=False)

print("\n✅ Arquivos de configuração criados:")
print("- package.json (dependências do backend)")
print("- server.js (servidor principal)")
print("- .env.example (variáveis de ambiente)")
print("- vercel.json (config do frontend)")