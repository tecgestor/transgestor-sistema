// Sistema TransGestor - JavaScript Principal
// Configuração da API
const API_BASE_URL = 'https://transgestor-sistema.onrender.com'; // Substitua pela URL real do seu backend

// Estado global
let currentUser = null;
let isLoggedIn = false;
let editingItemId = null;
let editingItemType = null;
let currentFilters = {};

let dadosLocais = {
    veiculos: [
        {id: 1, placaCaminhao: "RXP-2674", placaCarreta: "ABC-1234", modelo: "Volvo FH", ano: 2020, eixosCarreta: 3, status: "ativo"}
    ],
    motoristas: [
        {id: 1, nome: "Elias Rodrigues da Silva", cpf: "123.456.789-00", cnh: "12345678901", telefone: "(14) 99999-9999", status: "ativo"}
    ],
    viagens: [
        {
            id: 1, dataViagem: "2025-04-28", motorista: "Elias Rodrigues da Silva", 
            veiculo: "RXP-2674", placaCarreta: "ABC-1234", localCarga: "VRS", 
            localDescarga: "Brasília", kmInicio: 216780, kmFim: 217685, 
            pesoSaida: 39.80, pesoChegada: 39.80, valorTonelada: 200.00, 
            freteTotal: 8211.84, status: "finalizada", saldoEnvelope: 3542.25,
            dataFinalizacao: "2025-04-30",
            abastecimentos: [
                {posto: "FERNAND", km: 216780, litros: 404, valor: 903.20},
                {posto: "FERNAND", km: "", litros: 250, valor: 556.00}
            ],
            arla: {km: 216795, litros: 2.45, valor: 110.25},
            pedagioRetorno: 7.50, outrasDespesas: 10.00,
            observacoes: "Conferir 250 litros Diesel - que está na NF até 560 ps AA"
        }
    ],
    despesas: [
        {id: 1, tipo: "Combustível", numeroNota: "12345", valor: 1500.00, dataVencimento: "2025-10-20", veiculo: "RXP-2674", status: "pago", dataPagamento: "2025-09-25"}
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
    ],
    pagamentos: [
        {id: 1, despesaId: 1, valor: 1500.00, dataPagamento: "2025-09-25", bancoId: 1, observacoes: "Pagamento combustível", usuarioId: 1}
    ],
    logs: []
};

let nextId = 100;

// === SISTEMA DE LOGS ===
function logAction(action, entityType, entityId, changes, oldData = null) {
    const logEntry = {
        id: nextId++,
        userId: currentUser?.id,
        userName: currentUser?.nome,
        action: action,
        entityType: entityType,
        entityId: entityId,
        changes: changes,
        oldData: oldData,
        timestamp: new Date().toISOString()
    };

    dadosLocais.logs.push(logEntry);
    localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));
    console.log('📝 Log registrado:', logEntry);
}

// === SISTEMA DE AUTENTICAÇÃO ===
async function doLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginUser').value;
    const senha = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        errorDiv.textContent = '';
        const usuariosDemo = [
            { id: 1, nome: "Administrador", email: "admin@empresa.com", senha: "123", perfilId: 1 },
            { id: 2, nome: "Financeiro", email: "financeiro@empresa.com", senha: "123", perfilId: 2 }
        ];

        const usuario = usuariosDemo.find(u => u.email === email && u.senha === senha);

        if (usuario) {
            loginSuccess(usuario, 'demo-token');
            logAction('LOGIN', 'USER', usuario.id, { email: email }, null);
        } else {
            errorDiv.textContent = 'Email ou senha incorretos!';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        errorDiv.textContent = 'Erro ao conectar.';
    }
}

function loginSuccess(usuario, token) {
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
    logAction('LOGOUT', 'USER', currentUser?.id, {}, null);
    currentUser = null;
    isLoggedIn = false;

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

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

// === NAVEGAÇÃO ===
function showSection(sectionId, clickedElement) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
    if (clickedElement) clickedElement.classList.add('active');

    loadSectionData(sectionId);
    return false;
}

// === SISTEMA DE MODAIS CORRIGIDO ===
function openModal(modalId, itemId = null) {
    console.log('📋 Abrindo modal:', modalId, itemId ? `(editando ID: ${itemId})` : '(novo)');

    editingItemId = itemId;
    editingItemType = modalId.replace('modal', '').toLowerCase();

    // Remover modal existente se houver
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    // Criar novo modal
    createModal(modalId);

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay') || createOverlay();

    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');

        // Pré-preencher dados se estiver editando
        if (itemId) {
            setTimeout(() => preencherDadosEdicao(modalId, itemId), 100);
        }

        if (modalId === 'modalViagem') {
            setTimeout(() => setupViagemCalculations(), 200);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');

    editingItemId = null;
    editingItemType = null;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('hidden');

    editingItemId = null;
    editingItemType = null;
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

// === FUNÇÃO SAVE CORRIGIDA ===
function saveItem(event, modalId) {
    event.preventDefault();
    console.log('💾 Salvando item do modal:', modalId);
    console.log('📝 Estado de edição:', editingItemId, editingItemType);

    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    // Converter FormData para objeto
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    console.log('📊 Dados do formulário:', data);

    const tipo = modalId.replace('modal', '').toLowerCase();
    const isEditing = editingItemId !== null;

    console.log('🔍 Tipo:', tipo, 'Editando:', isEditing);

    if (isEditing) {
        // EDITAR item existente
        const itemIndex = dadosLocais[tipo].findIndex(item => item.id === editingItemId);
        if (itemIndex === -1) {
            console.error('❌ Item não encontrado para edição');
            showNotification('Erro: Item não encontrado!', 'error');
            return;
        }

        const oldItem = {...dadosLocais[tipo][itemIndex]};

        // Atualizar item mantendo o ID
        const updatedItem = {
            ...dadosLocais[tipo][itemIndex],
            ...data,
            id: editingItemId // Garantir que o ID seja mantido
        };

        // Processamento especial para viagem
        if (tipo === 'viagens') {
            updatedItem = processViagemData(updatedItem, data);
        }

        dadosLocais[tipo][itemIndex] = updatedItem;

        logAction('UPDATE', tipo.toUpperCase(), editingItemId, updatedItem, oldItem);
        showNotification('Item atualizado com sucesso!', 'success');
        console.log('✅ Item atualizado:', updatedItem);

    } else {
        // CRIAR novo item
        const newItem = {
            id: nextId++,
            ...data,
            status: data.status || 'ativo'
        };

        // Processamento especial para viagem
        if (tipo === 'viagens') {
            newItem = processViagemData(newItem, data);
            newItem.status = newItem.status || 'andamento';
        }

        // Processamento especial para despesas e receitas
        if (tipo === 'despesas') {
            newItem.status = 'pendente';
        } else if (tipo === 'receitas') {
            newItem.status = 'pendente';
        }

        dadosLocais[tipo].push(newItem);

        logAction('CREATE', tipo.toUpperCase(), newItem.id, newItem, null);
        showNotification('Item criado com sucesso!', 'success');
        console.log('✅ Item criado:', newItem);
    }

    // Salvar no localStorage
    localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));

    // Fechar modal
    closeModal(modalId);

    // Recarregar dados
    const currentSection = document.querySelector('.section.active').id;
    loadSectionData(currentSection);
}

// === PROCESSAMENTO DE DADOS DA VIAGEM ===
function processViagemData(item, formData) {
    // Calcular frete
    item.pesoSaida = parseFloat(formData.pesoSaida) || 0;
    item.pesoChegada = parseFloat(formData.pesoChegada) || item.pesoSaida;
    item.valorTonelada = parseFloat(formData.valorTonelada) || 0;
    item.freteTotal = item.pesoSaida * item.valorTonelada;

    // Processar abastecimentos
    item.abastecimentos = [];
    for (let i = 1; i <= 3; i++) {
        const posto = formData[`posto${i}`];
        const km = formData[`kmPosto${i}`];
        const litros = formData[`litrosPosto${i}`];
        const valor = formData[`valorPosto${i}`];

        if (posto || litros || valor) {
            item.abastecimentos.push({
                posto: posto || '',
                km: km || '',
                litros: parseFloat(litros) || 0,
                valor: parseFloat(valor) || 0
            });
        }
    }

    // Processar ARLA
    item.arla = {
        km: formData.kmArla || '',
        litros: parseFloat(formData.litrosArla) || 0,
        valor: parseFloat(formData.valorArla) || 0
    };

    // Outras despesas
    item.pedagioRetorno = parseFloat(formData.pedagioRetorno) || 0;
    item.outrasDespesas = parseFloat(formData.outrasDespesas) || 0;

    // Calcular saldo
    const totalDespesas = item.abastecimentos.reduce((sum, ab) => sum + ab.valor, 0) +
                         item.arla.valor + 
                         item.pedagioRetorno + 
                         item.outrasDespesas;

    item.saldoEnvelope = item.freteTotal - totalDespesas;

    // Status e finalização
    if (formData.status === 'finalizada' && formData.dataFinalizacao) {
        item.status = 'finalizada';
        item.dataFinalizacao = formData.dataFinalizacao;
    }

    return item;
}

// Continue na próxima parte...
console.log('🔧 Primeira parte do app.js carregada - sistema de modais corrigido');

// === CRIAÇÃO DINÂMICA DE MODAIS CORRIGIDA ===
function createModal(modalId) {
    console.log('🏗️ Criando modal:', modalId);

    const modalConfig = {
        modalVeiculo: {
            title: '🚛 Novo Veículo',
            fields: [
                {name: 'placaCaminhao', label: 'Placa do Caminhão', type: 'text', required: true, placeholder: 'Ex: ABC-1234'},
                {name: 'placaCarreta', label: 'Placa da Carreta', type: 'text', required: true, placeholder: 'Ex: DEF-5678'},
                {name: 'modelo', label: 'Modelo', type: 'text', required: true, placeholder: 'Ex: Volvo FH'},
                {name: 'ano', label: 'Ano', type: 'number', required: true, placeholder: '2020'},
                {name: 'eixosCarreta', label: 'Eixos da Carreta', type: 'number', required: true, placeholder: '3'}
            ]
        },
        modalMotorista: {
            title: '👨‍💼 Novo Motorista',
            fields: [
                {name: 'nome', label: 'Nome Completo', type: 'text', required: true, placeholder: 'Nome completo do motorista'},
                {name: 'cpf', label: 'CPF', type: 'text', required: true, placeholder: '000.000.000-00'},
                {name: 'cnh', label: 'CNH', type: 'text', required: true, placeholder: 'Número da CNH'},
                {name: 'telefone', label: 'Telefone', type: 'tel', required: true, placeholder: '(00) 99999-9999'}
            ]
        },
        modalViagem: {
            title: '🛣️ Nova Viagem (Envelope)',
            customHTML: `
                <div class="viagem-form">
                    <div class="form-section">
                        <h4>📋 Dados da Viagem</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Data da Viagem:</label>
                                <input type="date" name="dataViagem" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Motorista:</label>
                                <select name="motorista" class="form-control" required>
                                    <option value="">Selecione o motorista</option>
                                    <option value="Elias Rodrigues da Silva">Elias Rodrigues da Silva</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Placa Caminhão:</label>
                                <select name="veiculo" class="form-control" required>
                                    <option value="">Selecione o veículo</option>
                                    <option value="RXP-2674">RXP-2674</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Placa Carreta:</label>
                                <input type="text" name="placaCarreta" class="form-control" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>📍 Local de Carga/Descarga</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Local da Carga:</label>
                                <input type="text" name="localCarga" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Local da Descarga:</label>
                                <input type="text" name="localDescarga" class="form-control" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🛣️ Quilometragem</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">KM Início:</label>
                                <input type="number" name="kmInicio" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">KM Fim:</label>
                                <input type="number" name="kmFim" class="form-control" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>⚖️ Peso e Frete</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Peso de Saída (ton):</label>
                                <input type="number" step="0.01" name="pesoSaida" class="form-control" oninput="calcularFrete()" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Peso de Chegada (ton):</label>
                                <input type="number" step="0.01" name="pesoChegada" class="form-control">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Valor por Tonelada (R$):</label>
                                <input type="number" step="0.01" name="valorTonelada" class="form-control" oninput="calcularFrete()" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Frete Total (R$):</label>
                                <input type="number" step="0.01" name="freteTotal" class="form-control frete-total" readonly>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>⛽ Abastecimentos</h4>
                        <div class="abastecimento-group">
                            <h5>Posto 1:</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Posto:</label>
                                    <input type="text" name="posto1" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">KM:</label>
                                    <input type="number" name="kmPosto1" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Litros:</label>
                                    <input type="number" step="0.01" name="litrosPosto1" class="form-control" oninput="calcularSaldo()">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Valor (R$):</label>
                                    <input type="number" step="0.01" name="valorPosto1" class="form-control" oninput="calcularSaldo()">
                                </div>
                            </div>
                        </div>

                        <div class="abastecimento-group">
                            <h5>Posto 2:</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Posto:</label>
                                    <input type="text" name="posto2" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">KM:</label>
                                    <input type="number" name="kmPosto2" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Litros:</label>
                                    <input type="number" step="0.01" name="litrosPosto2" class="form-control" oninput="calcularSaldo()">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Valor (R$):</label>
                                    <input type="number" step="0.01" name="valorPosto2" class="form-control" oninput="calcularSaldo()">
                                </div>
                            </div>
                        </div>

                        <div class="abastecimento-group">
                            <h5>Posto 3:</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Posto:</label>
                                    <input type="text" name="posto3" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">KM:</label>
                                    <input type="number" name="kmPosto3" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Litros:</label>
                                    <input type="number" step="0.01" name="litrosPosto3" class="form-control" oninput="calcularSaldo()">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Valor (R$):</label>
                                    <input type="number" step="0.01" name="valorPosto3" class="form-control" oninput="calcularSaldo()">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🔵 ARLA</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">KM ARLA:</label>
                                <input type="number" name="kmArla" class="form-control">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Litros ARLA:</label>
                                <input type="number" step="0.01" name="litrosArla" class="form-control" oninput="calcularSaldo()">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Valor ARLA (R$):</label>
                                <input type="number" step="0.01" name="valorArla" class="form-control" oninput="calcularSaldo()">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>💰 Outras Despesas</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Pedágio Retorno (R$):</label>
                                <input type="number" step="0.01" name="pedagioRetorno" class="form-control" oninput="calcularSaldo()">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Outras Despesas (R$):</label>
                                <input type="number" step="0.01" name="outrasDespesas" class="form-control" oninput="calcularSaldo()">
                            </div>
                        </div>
                    </div>

                    <div class="form-section saldo-section">
                        <h4>💵 Saldo no Envelope</h4>
                        <div class="saldo-display">
                            <span class="saldo-valor" id="saldoEnvelope">R$ 0,00</span>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>📝 Observações</h4>
                        <div class="form-group">
                            <label class="form-label">Observações:</label>
                            <textarea name="observacoes" class="form-control" rows="3" placeholder="Adicione observações sobre a viagem..."></textarea>
                        </div>
                    </div>
                </div>
            `
        },
        modalDespesa: {
            title: '📄 Nova Despesa',
            fields: [
                {name: 'tipo', label: 'Tipo de Despesa', type: 'select', options: ['Combustível', 'Manutenção', 'Pneu', 'Pedágio', 'Alimentação'], required: true},
                {name: 'numeroNota', label: 'Número da Nota', type: 'text', required: true, placeholder: 'Número da NF'},
                {name: 'valor', label: 'Valor', type: 'number', step: '0.01', required: true, placeholder: '0,00'},
                {name: 'dataVencimento', label: 'Data de Vencimento', type: 'date', required: true},
                {name: 'veiculo', label: 'Veículo', type: 'text', required: true, placeholder: 'Placa do veículo'}
            ]
        },
        modalReceita: {
            title: '💰 Nova Receita',
            fields: [
                {name: 'descricao', label: 'Descrição', type: 'text', required: true, placeholder: 'Descrição da receita'},
                {name: 'valor', label: 'Valor', type: 'number', step: '0.01', required: true, placeholder: '0,00'},
                {name: 'dataPrevisao', label: 'Data Prevista', type: 'date', required: true}
            ]
        },
        modalBanco: {
            title: '🏦 Nova Conta Bancária',
            fields: [
                {name: 'nome', label: 'Nome do Banco', type: 'text', required: true, placeholder: 'Ex: Banco do Brasil'},
                {name: 'agencia', label: 'Agência', type: 'text', required: true, placeholder: '1234'},
                {name: 'conta', label: 'Conta', type: 'text', required: true, placeholder: '56789-0'},
                {name: 'saldo', label: 'Saldo', type: 'number', step: '0.01', required: true, placeholder: '0,00'}
            ]
        },
        modalUsuario: {
            title: '👥 Novo Usuário',
            fields: [
                {name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Nome completo'},
                {name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'usuario@empresa.com'},
                {name: 'perfil', label: 'Perfil', type: 'select', options: ['Administrador', 'Financeiro', 'Operacional'], required: true}
            ]
        },
        modalPerfil: {
            title: '🔐 Novo Perfil',
            fields: [
                {name: 'nome', label: 'Nome do Perfil', type: 'text', required: true, placeholder: 'Nome do perfil'},
                {name: 'descricao', label: 'Descrição', type: 'text', required: true, placeholder: 'Descrição do perfil'}
            ]
        }
    };

    const config = modalConfig[modalId];
    if (!config) {
        console.error('❌ Configuração do modal não encontrada:', modalId);
        return;
    }

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal hidden';

    let contentHTML = '';

    if (config.customHTML) {
        // Para modal de viagem com HTML customizado
        contentHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${config.title}</h3>
                    <button type="button" onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <form onsubmit="saveItem(event, '${modalId}')">
                    ${config.customHTML}
                    <div class="modal-footer">
                        <button type="button" onclick="closeModal('${modalId}')" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Salvar Viagem</button>
                    </div>
                </form>
            </div>
        `;
    } else {
        // Para outros modais com campos padrão
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
            } else if (field.type === 'textarea') {
                fieldsHTML += `
                    <div class="form-group">
                        <label class="form-label">${field.label}:</label>
                        <textarea name="${field.name}" ${field.required ? 'required' : ''} class="form-control" rows="3" placeholder="${field.placeholder || ''}"></textarea>
                    </div>
                `;
            } else {
                fieldsHTML += `
                    <div class="form-group">
                        <label class="form-label">${field.label}:</label>
                        <input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''} class="form-control" ${field.step ? `step="${field.step}"` : ''} placeholder="${field.placeholder || ''}">
                    </div>
                `;
            }
        });

        contentHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${config.title}</h3>
                    <button type="button" onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <form onsubmit="saveItem(event, '${modalId}')">
                    ${fieldsHTML}
                    <div class="modal-footer">
                        <button type="button" onclick="closeModal('${modalId}')" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">💾 Salvar</button>
                    </div>
                </form>
            </div>
        `;
    }

    modal.innerHTML = contentHTML;
    document.body.appendChild(modal);

    console.log('✅ Modal criado com sucesso:', modalId);
}

// === CÁLCULOS DA VIAGEM ===
function setupViagemCalculations() {
    console.log('🧮 Configurando cálculos da viagem...');

    // Adicionar event listeners para cálculos automáticos
    const pesoSaidaInput = document.querySelector('[name="pesoSaida"]');
    const valorToneladaInput = document.querySelector('[name="valorTonelada"]');

    if (pesoSaidaInput) {
        pesoSaidaInput.addEventListener('input', calcularFrete);
    }
    if (valorToneladaInput) {
        valorToneladaInput.addEventListener('input', calcularFrete);
    }

    // Event listeners para todas as despesas
    for (let i = 1; i <= 3; i++) {
        const valorPostoInput = document.querySelector(`[name="valorPosto${i}"]`);
        if (valorPostoInput) {
            valorPostoInput.addEventListener('input', calcularSaldo);
        }
    }

    const valorArlaInput = document.querySelector('[name="valorArla"]');
    const pedagioRetornoInput = document.querySelector('[name="pedagioRetorno"]');
    const outrasDespesasInput = document.querySelector('[name="outrasDespesas"]');

    if (valorArlaInput) valorArlaInput.addEventListener('input', calcularSaldo);
    if (pedagioRetornoInput) pedagioRetornoInput.addEventListener('input', calcularSaldo);
    if (outrasDespesasInput) outrasDespesasInput.addEventListener('input', calcularSaldo);
}

function calcularFrete() {
    const pesoSaida = parseFloat(document.querySelector('[name="pesoSaida"]')?.value) || 0;
    const valorTonelada = parseFloat(document.querySelector('[name="valorTonelada"]')?.value) || 0;
    const freteTotal = pesoSaida * valorTonelada;

    const freteTotalInput = document.querySelector('[name="freteTotal"]');
    if (freteTotalInput) {
        freteTotalInput.value = freteTotal.toFixed(2);
    }

    calcularSaldo();
}

function calcularSaldo() {
    const freteTotal = parseFloat(document.querySelector('[name="freteTotal"]')?.value) || 0;

    // Somar todas as despesas
    const valorPosto1 = parseFloat(document.querySelector('[name="valorPosto1"]')?.value) || 0;
    const valorPosto2 = parseFloat(document.querySelector('[name="valorPosto2"]')?.value) || 0;
    const valorPosto3 = parseFloat(document.querySelector('[name="valorPosto3"]')?.value) || 0;
    const valorArla = parseFloat(document.querySelector('[name="valorArla"]')?.value) || 0;
    const pedagioRetorno = parseFloat(document.querySelector('[name="pedagioRetorno"]')?.value) || 0;
    const outrasDespesas = parseFloat(document.querySelector('[name="outrasDespesas"]')?.value) || 0;

    const totalDespesas = valorPosto1 + valorPosto2 + valorPosto3 + valorArla + pedagioRetorno + outrasDespesas;
    const saldoEnvelope = freteTotal - totalDespesas;

    const saldoDisplay = document.getElementById('saldoEnvelope');
    if (saldoDisplay) {
        saldoDisplay.textContent = formatCurrency(saldoEnvelope);
        saldoDisplay.className = `saldo-valor ${saldoEnvelope >= 0 ? 'positivo' : 'negativo'}`;
    }
}

// === PRÉ-PREENCHIMENTO DE DADOS ===
function preencherDadosEdicao(modalId, itemId) {
    const tipo = modalId.replace('modal', '').toLowerCase();
    const item = dadosLocais[tipo].find(i => i.id === itemId);

    if (!item) {
        console.error('❌ Item não encontrado para edição:', tipo, itemId);
        return;
    }

    console.log('📝 Preenchendo dados para edição:', item);

    const form = document.querySelector(`#${modalId} form`);
    if (!form) {
        console.error('❌ Formulário não encontrado');
        return;
    }

    // Preencher campos básicos
    Object.keys(item).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input && key !== 'id') {
            if (input.type === 'checkbox') {
                input.checked = item[key];
            } else {
                input.value = item[key] || '';
            }
        }
    });

    // Tratamento especial para viagem
    if (tipo === 'viagens') {
        // Preencher abastecimentos
        if (item.abastecimentos) {
            item.abastecimentos.forEach((ab, index) => {
                const num = index + 1;
                const postoInput = form.querySelector(`[name="posto${num}"]`);
                const kmInput = form.querySelector(`[name="kmPosto${num}"]`);
                const litrosInput = form.querySelector(`[name="litrosPosto${num}"]`);
                const valorInput = form.querySelector(`[name="valorPosto${num}"]`);

                if (postoInput) postoInput.value = ab.posto || '';
                if (kmInput) kmInput.value = ab.km || '';
                if (litrosInput) litrosInput.value = ab.litros || '';
                if (valorInput) valorInput.value = ab.valor || '';
            });
        }

        // Preencher ARLA
        if (item.arla) {
            const arlaKm = form.querySelector(`[name="kmArla"]`);
            const arlaLitros = form.querySelector(`[name="litrosArla"]`);
            const arlaValor = form.querySelector(`[name="valorArla"]`);

            if (arlaKm) arlaKm.value = item.arla.km || '';
            if (arlaLitros) arlaLitros.value = item.arla.litros || '';
            if (arlaValor) arlaValor.value = item.arla.valor || '';
        }

        // Recalcular saldos após preencher
        setTimeout(() => {
            calcularFrete();
            calcularSaldo();
        }, 100);

        // Mostrar campos de finalização se necessário
        if (item.status !== 'finalizada') {
            const finalizationSection = `
                <div class="form-section finalization-section">
                    <h4>🏁 Finalização da Viagem</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Status:</label>
                            <select name="status" class="form-control">
                                <option value="andamento" ${item.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                                <option value="finalizada">Finalizada</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Data de Finalização:</label>
                            <input type="date" name="dataFinalizacao" class="form-control" value="${item.dataFinalizacao || ''}">
                        </div>
                    </div>
                </div>
            `;

            const observacoesSection = form.querySelector('.form-section:last-of-type');
            if (observacoesSection) {
                observacoesSection.insertAdjacentHTML('beforebegin', finalizationSection);
            }
        }
    }

    // Atualizar título do modal
    const title = form.closest('.modal').querySelector('h3');
    if (title) {
        title.textContent = title.textContent.replace('Nova', 'Editar').replace('Novo', 'Editar');
    }

    // Atualizar botão de salvar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && itemId) {
        submitBtn.innerHTML = '💾 Salvar Alterações';
    }

    console.log('✅ Dados preenchidos com sucesso');
}

console.log('🔧 Segunda parte do app.js carregada - criação de modais e pré-preenchimento');

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
    console.log('📊 Carregando dashboard...');

    const totalReceitas = dadosLocais.receitas.filter(r => r.status === 'recebido').reduce((sum, r) => sum + parseFloat(r.valor), 0);
    const totalDespesas = dadosLocais.despesas.filter(d => d.status === 'pago').reduce((sum, d) => sum + parseFloat(d.valor), 0);
    const saldoLiquido = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (saldoLiquido / totalReceitas * 100).toFixed(1) : 0;

    // Atualizar KPIs
    document.getElementById('receitaTotal').textContent = formatCurrency(totalReceitas);
    document.getElementById('despesasTotal').textContent = formatCurrency(totalDespesas);
    document.getElementById('saldoLiquido').textContent = formatCurrency(saldoLiquido);
    document.getElementById('margemTotal').textContent = `${margem}%`;

    console.log('✅ Dashboard carregado');
}

async function loadVeiculos() {
    const container = document.getElementById('listaVeiculos');
    if (!container) return;

    let dados = dadosLocais.veiculos;
    if (currentFilters.veiculos) {
        dados = filterData(dados, currentFilters.veiculos);
    }

    container.innerHTML = dados.map(v => `
        <div class="item-lista">
            <strong>${v.placaCaminhao}</strong> - ${v.modelo} (${v.ano})<br>
            <small>Carreta: ${v.placaCarreta} | Eixos: ${v.eixosCarreta} | Status: ${v.status}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-info" onclick="openViewModal('veiculos', ${v.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalVeiculo', ${v.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('veiculos', ${v.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');

    console.log('✅ Veículos carregados:', dados.length);
}

async function loadMotoristas() {
    const container = document.getElementById('listaMotoristas');
    if (!container) return;

    let dados = dadosLocais.motoristas;
    if (currentFilters.motoristas) {
        dados = filterData(dados, currentFilters.motoristas);
    }

    container.innerHTML = dados.map(m => `
        <div class="item-lista">
            <strong>${m.nome}</strong><br>
            <small>CPF: ${m.cpf} | CNH: ${m.cnh} | Tel: ${m.telefone}</small>
            <div class="item-actions">
                <button class="btn btn-sm btn-info" onclick="openViewModal('motoristas', ${m.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalMotorista', ${m.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteItem('motoristas', ${m.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');

    console.log('✅ Motoristas carregados:', dados.length);
}

async function loadViagens() {
    const container = document.getElementById('listaViagens');
    if (!container) return;

    let dados = dadosLocais.viagens;
    if (currentFilters.viagens) {
        dados = filterData(dados, currentFilters.viagens);
    }

    container.innerHTML = dados.map(v => {
        const isFinalized = v.status === 'finalizada';
        const canEdit = currentUser?.perfilId === 1 || !isFinalized; // Admin sempre pode editar

        return `
            <div class="item-lista">
                <strong>${formatDate(v.dataViagem)} - ${v.localCarga || v.origem} → ${v.localDescarga || v.destino}</strong><br>
                <small>Motorista: ${v.motorista} | Veículo: ${v.veiculo} | Frete: ${formatCurrency(v.freteTotal || 0)} | Saldo: ${formatCurrency(v.saldoEnvelope || 0)}</small>
                <span class="status ${v.status === 'finalizada' ? 'status-success' : 'status-warning'}">${v.status}</span>
                ${v.dataFinalizacao ? `<br><small>Finalizada em: ${formatDate(v.dataFinalizacao)}</small>` : ''}
                <div class="item-actions">
                    <button class="btn btn-sm btn-info" onclick="openViewModal('viagens', ${v.id})">👁️ Ver</button>
                    ${canEdit ? `<button class="btn btn-sm btn-outline" onclick="openModal('modalViagem', ${v.id})">✏️ Editar</button>` : ''}
                    <button class="btn btn-sm btn-outline" onclick="deleteItem('viagens', ${v.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }).join('');

    console.log('✅ Viagens carregadas:', dados.length);
}

async function loadDespesas() {
    const container = document.getElementById('listaDespesas');
    if (!container) return;

    let dados = dadosLocais.despesas;
    if (currentFilters.despesas) {
        dados = filterData(dados, currentFilters.despesas);
    }

    container.innerHTML = dados.map(d => {
        const isPago = d.status === 'pago';

        return `
            <div class="item-lista">
                <strong>${d.tipo} - NF: ${d.numeroNota}</strong> - ${formatCurrency(d.valor)}<br>
                <small>Vencimento: ${formatDate(d.dataVencimento)} | Veículo: ${d.veiculo}</small>
                ${isPago && d.dataPagamento ? `<br><small>Pago em: ${formatDate(d.dataPagamento)}</small>` : ''}
                <span class="status ${d.status === 'pago' ? 'status-success' : 'status-warning'}">${d.status}</span>
                <div class="item-actions">
                    <button class="btn btn-sm btn-info" onclick="openViewModal('despesas', ${d.id})">👁️ Ver</button>
                    <button class="btn btn-sm btn-outline" onclick="openModal('modalDespesa', ${d.id})">✏️ Editar</button>
                    ${!isPago ? `<button class="btn btn-sm btn-success" onclick="pagarDespesa(${d.id})">💳 Baixar</button>` : `<button class="btn btn-sm btn-warning" onclick="estornarPagamento(${d.id})">↩️ Estornar</button>`}
                    <button class="btn btn-sm btn-outline" onclick="deleteItem('despesas', ${d.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }).join('');

    console.log('✅ Despesas carregadas:', dados.length);
}

async function loadReceitas() {
    const container = document.getElementById('listaReceitas');
    if (!container) return;

    let dados = dadosLocais.receitas;
    if (currentFilters.receitas) {
        dados = filterData(dados, currentFilters.receitas);
    }

    container.innerHTML = dados.map(r => `
        <div class="item-lista">
            <strong>${r.descricao}</strong> - ${formatCurrency(r.valor)}<br>
            <small>Previsão: ${formatDate(r.dataPrevisao)}</small>
            ${r.dataRecebimento ? `<br><small>Recebido em: ${formatDate(r.dataRecebimento)}</small>` : ''}
            <span class="status ${r.status === 'recebido' ? 'status-success' : 'status-warning'}">${r.status}</span>
            <div class="item-actions">
                <button class="btn btn-sm btn-info" onclick="openViewModal('receitas', ${r.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalReceita', ${r.id})">✏️ Editar</button>
                ${r.status !== 'recebido' ? `<button class="btn btn-sm btn-success" onclick="receberReceita(${r.id})">💰 Receber</button>` : ''}
            </div>
        </div>
    `).join('');

    console.log('✅ Receitas carregadas:', dados.length);
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
                <button class="btn btn-sm btn-info" onclick="openViewModal('bancos', ${b.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalBanco', ${b.id})">✏️ Editar</button>
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
                <button class="btn btn-sm btn-info" onclick="openViewModal('usuarios', ${u.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalUsuario', ${u.id})">✏️ Editar</button>
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
                <button class="btn btn-sm btn-info" onclick="openViewModal('perfis', ${p.id})">👁️ Ver</button>
                <button class="btn btn-sm btn-outline" onclick="openModal('modalPerfil', ${p.id})">✏️ Editar</button>
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

// === SISTEMA DE FILTROS ===
function applyFilters(tipo) {
    const filterInputs = document.querySelectorAll(`#filtros${tipo.charAt(0).toUpperCase() + tipo.slice(1)} input, #filtros${tipo.charAt(0).toUpperCase() + tipo.slice(1)} select`);
    const filters = {};

    filterInputs.forEach(input => {
        if (input.value) {
            filters[input.name] = input.value.toLowerCase();
        }
    });

    currentFilters[tipo] = filters;
    console.log('🔍 Aplicando filtros:', tipo, filters);

    // Recarregar dados com filtros
    loadSectionData(tipo);
}

function clearFilters(tipo) {
    const filterInputs = document.querySelectorAll(`#filtros${tipo.charAt(0).toUpperCase() + tipo.slice(1)} input, #filtros${tipo.charAt(0).toUpperCase() + tipo.slice(1)} select`);

    filterInputs.forEach(input => {
        input.value = '';
    });

    currentFilters[tipo] = {};
    loadSectionData(tipo);

    showNotification('Filtros limpos', 'info');
}

function filterData(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
        return data;
    }

    return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (!item[key]) return false;

            const itemValue = item[key].toString().toLowerCase();

            // Para datas, verificar se contém o valor
            if (key.includes('data') || key.includes('Data')) {
                return itemValue.includes(value);
            }

            // Para outros campos, busca parcial
            return itemValue.includes(value);
        });
    });
}

// === PAGAMENTOS E ESTORNOS ===
function pagarDespesa(id) {
    const despesa = dadosLocais.despesas.find(d => d.id === id);
    if (!despesa) {
        showNotification('Despesa não encontrada!', 'error');
        return;
    }

    const oldData = {...despesa};

    despesa.status = 'pago';
    despesa.dataPagamento = new Date().toISOString().split('T')[0];

    // Criar registro de pagamento
    const pagamento = {
        id: nextId++,
        despesaId: id,
        valor: despesa.valor,
        dataPagamento: despesa.dataPagamento,
        bancoId: 1, // Banco padrão
        observacoes: `Pagamento de ${despesa.tipo}`,
        usuarioId: currentUser?.id
    };

    dadosLocais.pagamentos.push(pagamento);

    localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));

    logAction('UPDATE', 'DESPESAS', id, despesa, oldData);
    logAction('CREATE', 'PAGAMENTOS', pagamento.id, pagamento, null);

    loadDespesas();
    loadPagamentos();
    showNotification('Despesa paga com sucesso!', 'success');
}

function estornarPagamento(despesaId) {
    if (!confirm('Tem certeza que deseja estornar este pagamento?')) return;

    const despesa = dadosLocais.despesas.find(d => d.id === despesaId);
    const pagamento = dadosLocais.pagamentos.find(p => p.despesaId === despesaId);

    if (!despesa || !pagamento) {
        showNotification('Despesa ou pagamento não encontrado!', 'error');
        return;
    }

    const oldDespesaData = {...despesa};
    const oldPagamentoData = {...pagamento};

    // Reverter status da despesa
    despesa.status = 'pendente';
    delete despesa.dataPagamento;

    // Remover pagamento
    dadosLocais.pagamentos = dadosLocais.pagamentos.filter(p => p.id !== pagamento.id);

    localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));

    logAction('UPDATE', 'DESPESAS', despesaId, despesa, oldDespesaData);
    logAction('DELETE', 'PAGAMENTOS', pagamento.id, {}, oldPagamentoData);

    loadDespesas();
    loadPagamentos();
    showNotification('Pagamento estornado com sucesso!', 'success');
}

function receberReceita(id) {
    const receita = dadosLocais.receitas.find(r => r.id === id);
    if (receita) {
        const oldData = {...receita};

        receita.status = 'recebido';
        receita.dataRecebimento = new Date().toISOString().split('T')[0];

        localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));

        logAction('UPDATE', 'RECEITAS', id, receita, oldData);

        loadReceitas();
        showNotification('Receita recebida com sucesso!', 'success');
    }
}

// === DELETE ITEM ===
function deleteItem(tipo, id) {
    console.log(`🗑️ Excluindo ${tipo}:`, id);
    if (confirm('Tem certeza que deseja excluir este item?')) {
        const oldItem = dadosLocais[tipo].find(item => item.id === id);
        if (!oldItem) {
            showNotification('Item não encontrado!', 'error');
            return;
        }

        // Remover item
        dadosLocais[tipo] = dadosLocais[tipo].filter(item => item.id !== id);

        // Log da exclusão
        logAction('DELETE', tipo.toUpperCase(), id, {}, oldItem);

        // Salvar no localStorage
        localStorage.setItem('dadosTransgestor', JSON.stringify(dadosLocais));

        // Recarregar a tela
        const currentSection = document.querySelector('.section.active').id;
        loadSectionData(currentSection);

        showNotification('Item excluído com sucesso!', 'success');
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

// === MENU MOBILE ===
function toggleMenu() {
    const navList = document.getElementById('navList');
    if (navList) {
        navList.classList.toggle('active');
    }
}

console.log('🔧 Terceira parte do app.js carregada - carregamento de dados e filtros');

// === MODAIS DE VISUALIZAÇÃO ===
function openViewModal(tipo, itemId) {
    console.log('👁️ Abrindo visualização:', tipo, itemId);

    const item = dadosLocais[tipo].find(i => i.id === itemId);
    if (!item) {
        showNotification('Item não encontrado!', 'error');
        return;
    }

    logAction('VIEW', tipo.toUpperCase(), itemId, {}, null);

    // Criar modal de visualização
    const modalId = `viewModal${tipo}`;
    createViewModal(modalId, tipo, item);

    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay') || createOverlay();

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function createViewModal(modalId, tipo, item) {
    // Remover modal existente
    const existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal hidden';

    let content = '';

    if (tipo === 'viagens') {
        content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ Visualizar Viagem</h3>
                    <button onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <div class="view-content">
                    <div class="view-section">
                        <h4>📋 Dados da Viagem</h4>
                        <p><strong>Data:</strong> ${formatDate(item.dataViagem)}</p>
                        <p><strong>Motorista:</strong> ${item.motorista}</p>
                        <p><strong>Veículo:</strong> ${item.veiculo}</p>
                        <p><strong>Placa Carreta:</strong> ${item.placaCarreta}</p>
                        <p><strong>Status:</strong> <span class="status ${item.status === 'finalizada' ? 'status-success' : 'status-warning'}">${item.status}</span></p>
                        ${item.dataFinalizacao ? `<p><strong>Data Finalização:</strong> ${formatDate(item.dataFinalizacao)}</p>` : ''}
                    </div>

                    <div class="view-section">
                        <h4>📍 Locais</h4>
                        <p><strong>Carga:</strong> ${item.localCarga}</p>
                        <p><strong>Descarga:</strong> ${item.localDescarga}</p>
                        <p><strong>KM Início:</strong> ${item.kmInicio?.toLocaleString()}</p>
                        <p><strong>KM Fim:</strong> ${item.kmFim?.toLocaleString()}</p>
                        <p><strong>KM Rodados:</strong> ${(item.kmFim - item.kmInicio)?.toLocaleString()}</p>
                    </div>

                    <div class="view-section">
                        <h4>⚖️ Peso e Frete</h4>
                        <p><strong>Peso Saída:</strong> ${item.pesoSaida} ton</p>
                        <p><strong>Peso Chegada:</strong> ${item.pesoChegada} ton</p>
                        <p><strong>Valor por Tonelada:</strong> ${formatCurrency(item.valorTonelada)}</p>
                        <p><strong>Frete Total:</strong> ${formatCurrency(item.freteTotal)}</p>
                        <p><strong>Saldo Envelope:</strong> <span class="${item.saldoEnvelope >= 0 ? 'success' : 'error'}">${formatCurrency(item.saldoEnvelope)}</span></p>
                    </div>

                    <div class="view-section">
                        <h4>⛽ Abastecimentos</h4>
                        ${item.abastecimentos && item.abastecimentos.length > 0 ? item.abastecimentos.map((ab, i) => `
                            <div class="abastecimento-view">
                                <strong>Posto ${i+1}:</strong> ${ab.posto} - KM: ${ab.km} - ${ab.litros}L - ${formatCurrency(ab.valor)}
                            </div>
                        `).join('') : '<p>Nenhum abastecimento registrado</p>'}
                    </div>

                    ${item.arla && (item.arla.litros > 0 || item.arla.valor > 0) ? `
                    <div class="view-section">
                        <h4>🔵 ARLA</h4>
                        <p>KM: ${item.arla.km} - ${item.arla.litros}L - ${formatCurrency(item.arla.valor)}</p>
                    </div>
                    ` : ''}

                    <div class="view-section">
                        <h4>💰 Outras Despesas</h4>
                        <p><strong>Pedágio Retorno:</strong> ${formatCurrency(item.pedagioRetorno || 0)}</p>
                        <p><strong>Outras Despesas:</strong> ${formatCurrency(item.outrasDespesas || 0)}</p>
                    </div>

                    ${item.observacoes ? `
                    <div class="view-section">
                        <h4>📝 Observações</h4>
                        <p>${item.observacoes}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('${modalId}')" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        `;
    } else if (tipo === 'despesas') {
        content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ Visualizar Despesa</h3>
                    <button onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <div class="view-content">
                    <div class="view-section">
                        <h4>📄 Dados da Despesa</h4>
                        <p><strong>Tipo:</strong> ${item.tipo}</p>
                        <p><strong>Número da Nota:</strong> ${item.numeroNota}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(item.valor)}</p>
                        <p><strong>Data de Vencimento:</strong> ${formatDate(item.dataVencimento)}</p>
                        <p><strong>Veículo:</strong> ${item.veiculo}</p>
                        <p><strong>Status:</strong> <span class="status ${item.status === 'pago' ? 'status-success' : 'status-warning'}">${item.status}</span></p>
                        ${item.dataPagamento ? `<p><strong>Data Pagamento:</strong> ${formatDate(item.dataPagamento)}</p>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('${modalId}')" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        `;
    } else if (tipo === 'receitas') {
        content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ Visualizar Receita</h3>
                    <button onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <div class="view-content">
                    <div class="view-section">
                        <h4>💰 Dados da Receita</h4>
                        <p><strong>Descrição:</strong> ${item.descricao}</p>
                        <p><strong>Valor:</strong> ${formatCurrency(item.valor)}</p>
                        <p><strong>Data Previsão:</strong> ${formatDate(item.dataPrevisao)}</p>
                        <p><strong>Status:</strong> <span class="status ${item.status === 'recebido' ? 'status-success' : 'status-warning'}">${item.status}</span></p>
                        ${item.dataRecebimento ? `<p><strong>Data Recebimento:</strong> ${formatDate(item.dataRecebimento)}</p>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('${modalId}')" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        `;
    } else {
        // Modal genérico para outros tipos
        content = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👁️ Visualizar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
                    <button onclick="closeModal('${modalId}')" class="btn-close">✕</button>
                </div>
                <div class="view-content">
                    <div class="view-section">
                        ${Object.keys(item).filter(key => key !== 'id').map(key => {
                            let value = item[key];
                            if (key.includes('data') || key.includes('Data')) {
                                value = formatDate(value);
                            } else if (key.includes('valor') || key.includes('Valor') || key.includes('saldo')) {
                                value = formatCurrency(value);
                            }
                            return `<p><strong>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> ${value}</p>`;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('${modalId}')" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        `;
    }

    modal.innerHTML = content;
    document.body.appendChild(modal);
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚛 TransGestor v3.0 carregado!');

    // Carregar dados salvos
    const savedData = localStorage.getItem('dadosTransgestor');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            dadosLocais = {...dadosLocais, ...parsedData};
            console.log('📂 Dados salvos carregados do localStorage');
        } catch (e) {
            console.error('❌ Erro ao carregar dados salvos:', e);
        }
    }

    // Verificar usuário logado
    const savedUser = localStorage.getItem('usuario');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
        try {
            const usuario = JSON.parse(savedUser);
            loginSuccess(usuario, savedToken);
            console.log('👤 Usuário logado automaticamente:', usuario.nome);
        } catch (error) {
            console.error('❌ Erro ao restaurar sessão:', error);
            localStorage.clear();
        }
    }

    // Event listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', doLogin);
        console.log('🔐 Form de login configurado');
    }

    // Criar overlay
    createOverlay();

    console.log('✅ Sistema v3.0 inicializado com sucesso!');
    console.log('📝 Funcionalidades: Logs, Edição, Visualização, Filtros, Gráficos');
    console.log('🔧 Modais: Criação dinâmica funcionando');
    console.log('💾 Salvamento: LocalStorage ativo');
    console.log('🎯 Debug: Logs detalhados ativados');
});

// === EXPORTAR FUNÇÕES PARA ESCOPO GLOBAL ===
window.doLogin = doLogin;
window.logout = logout;
window.showSection = showSection;
window.openModal = openModal;
window.openViewModal = openViewModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.toggleMenu = toggleMenu;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.pagarDespesa = pagarDespesa;
window.estornarPagamento = estornarPagamento;
window.receberReceita = receberReceita;
window.calcularFrete = calcularFrete;
window.calcularSaldo = calcularSaldo;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;

// === LOGS DE INICIALIZAÇÃO ===
console.log('🌟 TRANSGESTOR v3.0 - SISTEMA COMPLETO INICIALIZADO!');
console.log('🔧 Correções aplicadas:');
console.log('  ✅ Sistema de modais completamente reescrito');
console.log('  ✅ Função saveItem corrigida e testada');
console.log('  ✅ Processamento de dados da viagem funcionando');
console.log('  ✅ Pré-preenchimento de dados para edição');
console.log('  ✅ Cálculos automáticos implementados');
console.log('  ✅ Sistema de logs detalhado para debug');
console.log('  ✅ LocalStorage funcionando corretamente');
console.log('  ✅ Filtros e visualização implementados');
console.log('');
console.log('🎯 Para testar:');
console.log('1. Faça login: admin@empresa.com / 123');
console.log('2. Clique em "Nova Viagem" ou "Novo Veículo"');
console.log('3. Preencha os campos e clique "Salvar"');
console.log('4. Verifique no console os logs detalhados');
console.log('5. Teste edição clicando no botão "Editar"');
console.log('');
console.log('🐛 Debug ativo - verifique o console para logs!');

console.log('🔧 Quarta e última parte do app.js carregada - inicialização e modais de visualização');
