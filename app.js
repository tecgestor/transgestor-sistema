// Sistema TransGestor - JavaScript Principal
// Configuração da API
const API_BASE_URL = 'https://transgestor-sistema.onrender.com'; // Substitua pela URL real do seu backend

// Estado global da aplicação
let currentUser = null;
let isLoggedIn = false;
let dadosLocais = {
    veiculos: [
        {id: 1, placaCaminhao: "RXP-2674", placaCarreta: "ABC-1234", modelo: "Volvo FH", ano: 2020, eixosCarreta: 3, status: "ativo"}
    ],
    motoristas: [
        {id: 1, nome: "Elias Rodrigues da Silva", cpf: "123.456.789-00", cnh: "12345678901", telefone: "(14) 99999-9999", status: "ativo"}
    ],
    viagens: [
        {id: 1, data: "2025-04-28", motorista: "Elias Rodrigues", veiculo: "RXP-2674", origem: "VRS", destino: "Brasília", status: "finalizada", frete: 8211.84}
    ],
    despesas: [
        {id: 1, tipo: "Combustível", numeroNota: "12345", valor: 1500.00, dataVencimento: "2025-10-20", veiculo: "RXP-2674", status: "pendente"}
    ],
    receitas: [
        {id: 1, descricao: "Frete VRS-Brasília", valor: 8211.84, dataPrevisao: "2025-09-30", status: "recebido"}
    ],
    bancos: [
        {id: 1, nome: "Banco do Brasil", agencia: "1234", conta: "56789-0", saldo: 50000.00, status: "ativo"}
    ],
    usuarios: [
        {id: 1, nome: "Administrador", email: "admin@empresa.com", perfil: "Administrador", status: "ativo"},
        {id: 2, nome: "Financeiro", email: "financeiro@empresa.com", perfil: "Financeiro", status: "ativo"}
    ],
    perfis: [
        {id: 1, nome: "Administrador", descricao: "Acesso total ao sistema"},
        {id: 2, nome: "Financeiro", descricao: "Acesso às funções financeiras"}
    ]
};

let nextId = 100;

// === SISTEMA DE AUTENTICAÇÃO ===
async function doLogin(event) {
    event.preventDefault();
    console.log('🔐 Tentativa de login...');

    const email = document.getElementById('loginUser').value;
    const senha = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        errorDiv.textContent = '';

        // Login demo (sempre funciona para demonstração)
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
        errorDiv.textContent = 'Erro ao conectar.';
    }
}

function loginSuccess(usuario, token) {
    console.log('✅ Login bem-sucedido:', usuario.nome);

    currentUser = usuario;
    isLoggedIn = true;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('currentUserName').textContent = usuario.nome;

    setupPermissions(usuario.perfilId);
    loadDashboard();

    showNotification('Login realizado com sucesso!', 'success');
}

function logout() {
    console.log('👋 Fazendo logout...');

    currentUser = null;
    isLoggedIn = false;

    localStorage.removeItem('token');
    localStorage.removeUser('usuario');

    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

// === CONTROLE DE PERMISSÕES ===
function setupPermissions(perfilId) {
    const permissoes = {
        1: { dashboard: true, veiculos: true, motoristas: true, viagens: true, despesas: true, pagamentos: true, receitas: true, bancos: true, usuarios: true, perfis: true },
        2: { dashboard: true, veiculos: false, motoristas: false, viagens: false, despesas: true, pagamentos: true, receitas: true, bancos: true, usuarios: false, perfis: false }
    };

    const userPermissions = permissoes[perfilId] || permissoes[1];

    Object.keys(userPermissions).forEach(secao => {
        const navItem = document.getElementById(`nav-${secao}`);
        if (navItem) {
            navItem.style.display = userPermissions[secao] ? 'block' : 'none';
        }
    });
}

// === NAVEGAÇÃO ENTRE SEÇÕES ===
function showSection(sectionId, clickedElement) {
    console.log('🔄 Navegando para:', sectionId);

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    loadSectionData(sectionId);
    return false;
}

// === SISTEMA DE MODAIS ===
function openModal(modalId) {
    console.log('📋 Abrindo modal:', modalId);

    // Criar modal dinamicamente se não existir
    if (!document.getElementById(modalId)) {
        createModal(modalId);
    }

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay') || createOverlay();

    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');

        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function closeModal(modalId) {
    console.log('❌ Fechando modal:', modalId);

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// === CRIAÇÃO DINÂMICA DE MODAIS ===
function createModal(modalId) {
    const modalConfig = {
        modalVeiculo: {
            title: '🚛 Veículo',
            fields: [
                {name: 'placaCaminhao', label: 'Placa do Caminhão', type: 'text', required: true},
                {name: 'placaCarreta', label: 'Placa da Carreta', type: 'text', required: true},
                {name: 'modelo', label: 'Modelo', type: 'text', required: true},
                {name: 'ano', label: 'Ano', type: 'number', required: true},
                {name: 'eixosCarreta', label: 'Eixos da Carreta', type: 'number', required: true}
            ]
        },
        modalMotorista: {
            title: '👨‍💼 Motorista',
            fields: [
                {name: 'nome', label: 'Nome Completo', type: 'text', required: true},
                {name: 'cpf', label: 'CPF', type: 'text', required: true},
                {name: 'cnh', label: 'CNH', type: 'text', required: true},
                {name: 'telefone', label: 'Telefone', type: 'tel', required: true}
            ]
        },
        modalViagem: {
            title: '🛣️ Viagem',
            fields: [
                {name: 'data', label: 'Data da Viagem', type: 'date', required: true},
                {name: 'motorista', label: 'Motorista', type: 'text', required: true},
                {name: 'veiculo', label: 'Veículo', type: 'text', required: true},
                {name: 'origem', label: 'Origem', type: 'text', required: true},
                {name: 'destino', label: 'Destino', type: 'text', required: true},
                {name: 'frete', label: 'Valor do Frete', type: 'number', step: '0.01', required: true}
            ]
        },
        modalDespesa: {
            title: '📄 Despesa',
            fields: [
                {name: 'tipo', label: 'Tipo de Despesa', type: 'select', options: ['Combustível', 'Manutenção', 'Pneu', 'Pedágio', 'Alimentação'], required: true},
                {name: 'numeroNota', label: 'Número da Nota', type: 'text', required: true},
                {name: 'valor', label: 'Valor', type: 'number', step: '0.01', required: true},
                {name: 'dataVencimento', label: 'Data de Vencimento', type: 'date', required: true},
                {name: 'veiculo', label: 'Veículo', type: 'text', required: true}
            ]
        },
        modalReceita: {
            title: '💰 Receita',
            fields: [
                {name: 'descricao', label: 'Descrição', type: 'text', required: true},
                {name: 'valor', label: 'Valor', type: 'number', step: '0.01', required: true},
                {name: 'dataPrevisao', label: 'Data Prevista', type: 'date', required: true}
            ]
        },
        modalBanco: {
            title: '🏦 Conta Bancária',
            fields: [
                {name: 'nome', label: 'Nome do Banco', type: 'text', required: true},
                {name: 'agencia', label: 'Agência', type: 'text', required: true},
                {name: 'conta', label: 'Conta', type: 'text', required: true},
                {name: 'saldo', label: 'Saldo', type: 'number', step: '0.01', required: true}
            ]
        },
        modalUsuario: {
            title: '👥 Usuário',
            fields: [
                {name: 'nome', label: 'Nome', type: 'text', required: true},
                {name: 'email', label: 'Email', type: 'email', required: true},
                {name: 'perfil', label: 'Perfil', type: 'select', options: ['Administrador', 'Financeiro', 'Operacional'], required: true}
            ]
        },
        modalPerfil: {
            title: '🔐 Perfil',
            fields: [
                {name: 'nome', label: 'Nome do Perfil', type: 'text', required: true},
                {name: 'descricao', label: 'Descrição', type: 'text', required: true}
            ]
        }
    };

    const config = modalConfig[modalId];
    if (!config) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal hidden';

    let fieldsHTML = '';
    config.fields.forEach(field => {
        if (field.type === 'select') {
            const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            fieldsHTML += `
                <div class="form-group">
                    <label class="form-label">${field.label}:</label>
                    <select name="${field.name}" ${field.required ? 'required' : ''} class="form-control">
                        <option value="">Selecione</option>
                        ${options}
                    </select>
                </div>
            `;
        } else {
            fieldsHTML += `
                <div class="form-group">
                    <label class="form-label">${field.label}:</label>
                    <input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''} class="form-control" ${field.step ? `step="${field.step}"` : ''}>
                </div>
            `;
        }
    });

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${config.title}</h3>
                <button onclick="closeModal('${modalId}')" class="btn-close">✕</button>
            </div>
            <form onsubmit="saveItem(event, '${modalId}')">
                ${fieldsHTML}
                <div class="modal-footer">
                    <button type="button" onclick="closeModal('${modalId}')" class="btn btn-secondary">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

function createOverlay() {
    if (document.getElementById('modalOverlay')) {
        return document.getElementById('modalOverlay');
    }

    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay hidden';
    overlay.onclick = closeAllModals;
    document.body.appendChild(overlay);
    return overlay;
}

// === FUNÇÕES DE SALVAR ===
function saveItem(event, modalId) {
    event.preventDefault();
    console.log('💾 Salvando item do modal:', modalId);

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.id = nextId++;
    data.status = 'ativo';

    // Salvar conforme o tipo
    const tipo = modalId.replace('modal', '').toLowerCase();

    switch(tipo) {
        case 'veiculo':
            dadosLocais.veiculos.push(data);
            loadVeiculos();
            break;
        case 'motorista':
            dadosLocais.motoristas.push(data);
            loadMotoristas();
            break;
        case 'viagem':
            data.status = 'em_andamento';
            dadosLocais.viagens.push(data);
            loadViagens();
            break;
        case 'despesa':
            data.status = 'pendente';
            dadosLocais.despesas.push(data);
            loadDespesas();
            break;
        case 'receita':
            data.status = 'pendente';
            dadosLocais.receitas.push(data);
            loadReceitas();
            break;
        case 'banco':
            dadosLocais.bancos.push(data);
            loadBancos();
            break;
        case 'usuario':
            dadosLocais.usuarios.push(data);
            loadUsuarios();
            break;
        case 'perfil':
            dadosLocais.perfis.push(data);
            loadPerfis();
            break;
    }

    closeModal(modalId);
    showNotification('Item salvo com sucesso!', 'success');

    // Atualizar localStorage
    localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));
}

// === FUNÇÕES DE EDITAR ===
function editItem(tipo, id) {
    console.log(`✏️ Editando ${tipo}:`, id);
    showNotification(`Função editar ${tipo} em desenvolvimento`, 'info');
}

function deleteItem(tipo, id) {
    console.log(`🗑️ Excluindo ${tipo}:`, id);
    if (confirm('Tem certeza que deseja excluir este item?')) {
        // Remover item do array correspondente
        dadosLocais[tipo] = dadosLocais[tipo].filter(item => item.id !== id);

        // Recarregar a tela
        const currentSection = document.querySelector('.section.active').id;
        loadSectionData(currentSection);

        showNotification('Item excluído com sucesso!', 'success');
        localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));
    }
}

// === CARREGAMENTO DE DADOS ===
async function loadSectionData(sectionId) {
    try {
        switch (sectionId) {
            case 'dashboard': await loadDashboard(); break;
            case 'veiculos': await loadVeiculos(); break;
            case 'motoristas': await loadMotoristas(); break;
            case 'viagens': await loadViagens(); break;
            case 'despesas': await loadDespesas(); break;
            case 'pagamentos': await loadPagamentos(); break;
            case 'receitas': await loadReceitas(); break;
            case 'bancos': await loadBancos(); break;
            case 'usuarios': await loadUsuarios(); break;
            case 'perfis': await loadPerfis(); break;
        }
    } catch (error) {
        console.error(`Erro ao carregar ${sectionId}:`, error);
    }
}

async function loadDashboard() {
    const totalReceitas = dadosLocais.receitas.filter(r => r.status === 'recebido').reduce((sum, r) => sum + parseFloat(r.valor), 0);
    const totalDespesas = dadosLocais.despesas.filter(d => d.status === 'pago').reduce((sum, d) => sum + parseFloat(d.valor), 0);
    const saldoLiquido = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (saldoLiquido / totalReceitas * 100).toFixed(1) : 0;

    document.getElementById('receitaTotal').textContent = formatCurrency(totalReceitas);
    document.getElementById('despesasTotal').textContent = formatCurrency(totalDespesas);
    document.getElementById('saldoLiquido').textContent = formatCurrency(saldoLiquido);
    document.getElementById('margemTotal').textContent = `${margem}%`;
}

async function loadVeiculos() {
    const container = document.getElementById('listaVeiculos');
    if (!container) return;

    container.innerHTML = dadosLocais.veiculos.map(v => `
        <div class="item-lista">
            <strong>${v.placaCaminhao}</strong> - ${v.modelo} (${v.ano})<br>
            <small>Carreta: ${v.placaCarreta} | Eixos: ${v.eixosCarreta} | Status: ${v.status}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('veiculos', ${v.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('veiculos', ${v.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadMotoristas() {
    const container = document.getElementById('listaMotoristas');
    if (!container) return;

    container.innerHTML = dadosLocais.motoristas.map(m => `
        <div class="item-lista">
            <strong>${m.nome}</strong><br>
            <small>CPF: ${m.cpf} | CNH: ${m.cnh} | Tel: ${m.telefone}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('motoristas', ${m.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('motoristas', ${m.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadViagens() {
    const container = document.getElementById('listaViagens');
    if (!container) return;

    container.innerHTML = dadosLocais.viagens.map(v => `
        <div class="item-lista">
            <strong>${formatDate(v.data)} - ${v.origem} → ${v.destino}</strong><br>
            <small>Motorista: ${v.motorista} | Veículo: ${v.veiculo} | Frete: ${formatCurrency(v.frete || 0)}</small>
            <span class="status ${v.status === 'finalizada' ? 'status-success' : 'status-warning'}">${v.status}</span>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('viagens', ${v.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('viagens', ${v.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadDespesas() {
    const container = document.getElementById('listaDespesas');
    if (!container) return;

    container.innerHTML = dadosLocais.despesas.map(d => `
        <div class="item-lista">
            <strong>${d.tipo} - NF: ${d.numeroNota}</strong> - ${formatCurrency(d.valor)}<br>
            <small>Vencimento: ${formatDate(d.dataVencimento)} | Veículo: ${d.veiculo}</small>
            <span class="status ${d.status === 'pago' ? 'status-success' : 'status-warning'}">${d.status}</span>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('despesas', ${d.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-success" onclick="pagarDespesa(${d.id})">💳 Baixar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('despesas', ${d.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadReceitas() {
    const container = document.getElementById('listaReceitas');
    if (!container) return;

    container.innerHTML = dadosLocais.receitas.map(r => `
        <div class="item-lista">
            <strong>${r.descricao}</strong> - ${formatCurrency(r.valor)}<br>
            <small>Previsão: ${formatDate(r.dataPrevisao)}</small>
            <span class="status ${r.status === 'recebido' ? 'status-success' : 'status-warning'}">${r.status}</span>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('receitas', ${r.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-success" onclick="receberReceita(${r.id})">💰 Receber</button>
            </div>
        </div>
    `).join('');
}

async function loadBancos() {
    const container = document.getElementById('listaBancos');
    if (!container) return;

    container.innerHTML = dadosLocais.bancos.map(b => `
        <div class="item-lista">
            <strong>${b.nome}</strong><br>
            <small>Ag: ${b.agencia} | Conta: ${b.conta} | Saldo: ${formatCurrency(b.saldo)}</small>
            <span class="status status-success">${b.status}</span>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('bancos', ${b.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('bancos', ${b.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadUsuarios() {
    const container = document.getElementById('listaUsuarios');
    if (!container) return;

    container.innerHTML = dadosLocais.usuarios.map(u => `
        <div class="item-lista">
            <strong>${u.nome}</strong> - ${u.email}<br>
            <small>Perfil: ${u.perfil} | Status: ${u.status}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('usuarios', ${u.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('usuarios', ${u.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadPerfis() {
    const container = document.getElementById('listaPerfis');
    if (!container) return;

    container.innerHTML = dadosLocais.perfis.map(p => `
        <div class="item-lista">
            <strong>${p.nome}</strong><br>
            <small>${p.descricao}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline" onclick="editItem('perfis', ${p.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('perfis', ${p.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

async function loadPagamentos() {
    const container = document.getElementById('despesasPendentesLista');
    if (!container) return;

    const despesasPendentes = dadosLocais.despesas.filter(d => d.status === 'pendente');

    container.innerHTML = despesasPendentes.map(d => `
        <div class="item-lista">
            <strong>${d.tipo} - ${formatCurrency(d.valor)}</strong><br>
            <small>NF: ${d.numeroNota} | Venc: ${formatDate(d.dataVencimento)}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-success" onclick="pagarDespesa(${d.id})">💸 Pagar</button>
            </div>
        </div>
    `).join('');
}

// === FUNÇÕES ESPECÍFICAS ===
function pagarDespesa(id) {
    const despesa = dadosLocais.despesas.find(d => d.id === id);
    if (despesa) {
        despesa.status = 'pago';
        despesa.dataPagamento = new Date().toISOString().split('T')[0];
        localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));
        loadPagamentos();
        loadDespesas();
        showNotification('Despesa paga com sucesso!', 'success');
    }
}

function receberReceita(id) {
    const receita = dadosLocais.receitas.find(r => r.id === id);
    if (receita) {
        receita.status = 'recebido';
        receita.dataRecebimento = new Date().toISOString().split('T')[0];
        localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));
        loadReceitas();
        showNotification('Receita recebida com sucesso!', 'success');
    }
}

// === MENU MOBILE ===
function toggleMenu() {
    const navList = document.getElementById('navList');
    if (navList) {
        navList.classList.toggle('active');
    }
}

// === FUNÇÕES UTILITÁRIAS ===
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    // Criar notificação visual
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚛 TransGestor carregado!');

    // Carregar dados salvos
    const savedData = localStorage.getItem('dadosTransgestor');
    if (savedData) {
        try {
            dadosLocais = {...dadosLocais, ...JSON.parse(savedData)};
        } catch (e) {
            console.error('Erro ao carregar dados salvos:', e);
        }
    }

    // Verificar usuário logado
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
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', doLogin);
    }

    // Criar overlay se não existir
    createOverlay();

    console.log('✅ Sistema inicializado com sucesso!');
});

// Exportar funções para escopo global
window.doLogin = doLogin;
window.logout = logout;
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.toggleMenu = toggleMenu;
window.saveItem = saveItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.pagarDespesa = pagarDespesa;
window.receberReceita = receberReceita;
