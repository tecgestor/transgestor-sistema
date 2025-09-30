// Sistema TransGestor - JavaScript Principal
// Configuração da API
const API_BASE_URL = 'https://transgestor-sistema.onrender.com'; // Substitua pela URL real do seu backend

// Estado global da aplicação
let currentUser = null;
let isLoggedIn = false;

// === SISTEMA DE AUTENTICAÇÃO ===
async function doLogin(event) {
    event.preventDefault();
    console.log('🔐 Tentativa de login...');

    const email = document.getElementById('loginUser').value;
    const senha = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        // Limpar erro anterior
        errorDiv.textContent = '';

        // Tentar login com backend (se disponível)
        if (API_BASE_URL && !API_BASE_URL.includes('seu-backend')) {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loginSuccess(data.usuario, data.token);
                    return;
                }
            }
        }

        // Fallback: Login local (demonstração)
        const usuariosDemo = [
            { id: 1, nome: "Administrador", email: "admin@empresa.com", senha: "123", perfilId: 1 },
            { id: 2, nome: "Financeiro", email: "financeiro@empresa.com", senha: "123", perfilId: 2 }
        ];

        const usuario = usuariosDemo.find(u => u.email === email && u.senha === senha);

        if (usuario) {
            loginSuccess(usuario, 'demo-token');
        } else {
            errorDiv.textContent = 'Email ou senha incorretos!';
        }

    } catch (error) {
        console.error('Erro no login:', error);
        errorDiv.textContent = 'Erro ao conectar. Usando modo demonstração.';

        // Login demo em caso de erro
        if (email === 'admin@empresa.com' && senha === '123') {
            loginSuccess({ id: 1, nome: "Admin Demo", email: email, perfilId: 1 }, 'demo-token');
        }
    }
}

function loginSuccess(usuario, token) {
    console.log('✅ Login bem-sucedido:', usuario.nome);

    currentUser = usuario;
    isLoggedIn = true;

    // Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));

    // Mostrar aplicação principal
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    // Atualizar interface
    document.getElementById('currentUserName').textContent = usuario.nome;

    // Configurar permissões baseadas no perfil
    setupPermissions(usuario.perfilId);

    // Carregar dados do dashboard
    loadDashboard();
}

function logout() {
    console.log('👋 Fazendo logout...');

    currentUser = null;
    isLoggedIn = false;

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');

    // Limpar formulário
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

// === CONTROLE DE PERMISSÕES ===
function setupPermissions(perfilId) {
    const permissoes = {
        1: { // Administrador
            dashboard: true, veiculos: true, motoristas: true, viagens: true,
            despesas: true, pagamentos: true, receitas: true, bancos: true, 
            usuarios: true, perfis: true
        },
        2: { // Financeiro
            dashboard: true, veiculos: false, motoristas: false, viagens: false,
            despesas: true, pagamentos: true, receitas: true, bancos: true, 
            usuarios: false, perfis: false
        }
    };

    const userPermissions = permissoes[perfilId] || permissoes[1];

    // Mostrar/ocultar itens do menu baseado nas permissões
    Object.keys(userPermissions).forEach(secao => {
        const navItem = document.getElementById(`nav-${secao}`);
        if (navItem) {
            if (userPermissions[secao]) {
                navItem.style.display = 'block';
            } else {
                navItem.style.display = 'none';
            }
        }
    });
}

// === NAVEGAÇÃO ENTRE SEÇÕES ===
function showSection(sectionId, clickedElement) {
    console.log('🔄 Navegando para:', sectionId);

    // Ocultar todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Marcar link como ativo
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // Carregar dados da seção
    loadSectionData(sectionId);

    return false;
}

// === CARREGAMENTO DE DADOS ===
async function loadSectionData(sectionId) {
    try {
        switch (sectionId) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'veiculos':
                await loadVeiculos();
                break;
            case 'motoristas':
                await loadMotoristas();
                break;
            case 'viagens':
                await loadViagens();
                break;
            case 'despesas':
                await loadDespesas();
                break;
            case 'pagamentos':
                await loadPagamentos();
                break;
            case 'receitas':
                await loadReceitas();
                break;
            case 'bancos':
                await loadBancos();
                break;
            case 'usuarios':
                await loadUsuarios();
                break;
            case 'perfis':
                await loadPerfis();
                break;
        }
    } catch (error) {
        console.error(`Erro ao carregar dados da seção ${sectionId}:`, error);
    }
}

async function loadDashboard() {
    try {
        // Tentar carregar do backend
        if (API_BASE_URL && !API_BASE_URL.includes('seu-backend')) {
            const response = await fetchWithAuth('/relatorios/dashboard');
            if (response) {
                updateDashboardUI(response);
                return;
            }
        }

        // Dados demo
        const dadosDemo = {
            totalReceitas: 8211.84,
            totalDespesas: 4521.52,
            saldoLiquido: 3690.32,
            despesasPendentes: 2,
            receitasPendentes: 1,
            totalViagens: 1
        };

        updateDashboardUI(dadosDemo);

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboardUI(dados) {
    document.getElementById('receitaTotal').textContent = `R$ ${dados.totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('despesasTotal').textContent = `R$ ${dados.totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('saldoLiquido').textContent = `R$ ${dados.saldoLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

    const margem = (dados.saldoLiquido / dados.totalReceitas * 100).toFixed(1);
    document.getElementById('margemTotal').textContent = `${margem}%`;
}

// === FUNÇÕES DE CARREGAMENTO DE DADOS (PLACEHOLDER) ===
async function loadVeiculos() {
    console.log('📊 Carregando veículos...');
}

async function loadMotoristas() {
    console.log('📊 Carregando motoristas...');
}

async function loadViagens() {
    console.log('📊 Carregando viagens...');
}

async function loadDespesas() {
    console.log('📊 Carregando despesas...');
}

async function loadPagamentos() {
    console.log('📊 Carregando pagamentos...');
}

async function loadReceitas() {
    console.log('📊 Carregando receitas...');
}

async function loadBancos() {
    console.log('📊 Carregando bancos...');
}

async function loadUsuarios() {
    console.log('📊 Carregando usuários...');
}

async function loadPerfis() {
    console.log('📊 Carregando perfis...');
}

// === SISTEMA DE MODAIS ===
function openModal(modalId) {
    console.log('📋 Abrindo modal:', modalId);

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');

    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');

        // Reset form se existir
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

function closeModal(modalId) {
    console.log('❌ Fechando modal:', modalId);

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');

    if (modal) {
        modal.classList.add('hidden');
    }

    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    document.getElementById('modalOverlay').classList.add('hidden');
}

// === MENU MOBILE ===
function toggleMenu() {
    console.log('📱 Toggle menu mobile');
    const navList = document.getElementById('navList');
    if (navList) {
        navList.classList.toggle('active');
    }
}

// === REQUISIÇÕES AUTENTICADAS ===
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    if (token && token !== 'demo-token') {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Token expirado, fazendo logout...');
                logout();
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        return null;
    }
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚛 TransGestor carregado!');

    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('usuario');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
        try {
            const usuario = JSON.parse(savedUser);
            loginSuccess(usuario, savedToken);
        } catch (error) {
            console.error('Erro ao restaurar sessão:', error);
            localStorage.clear();
        }
    }

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', doLogin);

    // Fechar modais ao clicar no overlay
    document.getElementById('modalOverlay').addEventListener('click', closeAllModals);

    // Fechar menu mobile ao clicar em um link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navList = document.getElementById('navList');
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
            }
        });
    });

    console.log('✅ Sistema inicializado com sucesso!');
});

// === FUNÇÕES UTILITÁRIAS ===
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    // Aqui você pode implementar um sistema de notificações toast
}

// Exportar para escopo global (para uso com onclick)
window.doLogin = doLogin;
window.logout = logout;
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.toggleMenu = toggleMenu;
