document.addEventListener('DOMContentLoaded', () => {
    // 1. Proteção de Rota dupla (já tínhamos feito, mas garantindo aqui)
    const papel = localStorage.getItem('papelUsuario');
    const token = localStorage.getItem('token');

    if (!token || papel !== 'ADMINISTRADOR') {
        alert("Acesso restrito apenas para Administradores.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Carrega os produtos do banco de dados ao entrar na tela
    carregarProdutos();
    carregarMercadosPendentes();
});

// ==========================================
// FUNÇÕES DO CRUD DE PRODUTOS
// ==========================================

async function carregarProdutos() {
    const token = localStorage.getItem('token');
    try {
        const resposta = await fetch(`${API_BASE_URL}/api/produtos`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
            const produtos = await resposta.json();
            renderizarCatalogo(produtos);
        }
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
    }
}

function renderizarCatalogo(produtos) {
    const divPendentes = document.getElementById('produtosPendentes');
    const divAprovados = document.getElementById('catalogoProdutos');
    
    divPendentes.innerHTML = '';
    divAprovados.innerHTML = '';

    // Filtra as listas
    const pendentes = produtos.filter(p => p.status === 'PENDENTE');
    const aprovados = produtos.filter(p => p.status === 'APROVADO');

    // Atualiza as estatísticas na tela
    document.getElementById('stat-produtos').innerText = aprovados.length;
    document.getElementById('stat-pendentes').innerText = pendentes.length;

    // --- RENDERIZA PENDENTES ---
    if (pendentes.length === 0) {
        divPendentes.innerHTML = '<p style="color: var(--texto-cinza);">Nenhuma solicitação pendente.</p>';
    } else {
        pendentes.forEach(prod => {
            const codigoTexto = prod.codigoBarras ? `Cód: ${prod.codigoBarras}` : 'Sem código';
            divPendentes.innerHTML += `
                <div class="produto-pendente" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #fbd38d; background: #fffaf0; border-radius: 8px; margin-bottom: 10px;">
                    <div class="pendente-info">
                        <strong style="display: block;">${prod.nome}</strong>
                        <span style="font-size: 12px; color: var(--texto-cinza);">${codigoTexto}</span>
                    </div>
                    <div class="pendente-acoes" style="display: flex; gap: 8px;">
                        <button class="btn-customizado-small" style="background: #48bb78;" onclick="alterarStatusProduto(${prod.id}, 'APROVADO')"><i class="ph ph-check"></i></button>
                        <button class="btn-customizado-small" style="background: #f56565;" onclick="alterarStatusProduto(${prod.id}, 'REJEITADO')"><i class="ph ph-x"></i></button>
                    </div>
                </div>
            `;
        });
    }

    // --- RENDERIZA APROVADOS ---
    if (aprovados.length === 0) {
        divAprovados.innerHTML = '<p style="color: var(--texto-cinza);">Catálogo vazio.</p>';
    } else {
        aprovados.forEach(prod => {
            const codigoTexto = prod.codigoBarras ? `(Cód: ${prod.codigoBarras})` : '';
            divAprovados.innerHTML += `
                <div class="produto-catalogo" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--borda); border-radius: 8px; margin-bottom: 8px;">
                    <span><strong>${prod.nome}</strong> <small style="color: var(--texto-cinza);">${codigoTexto}</small></span>
                    <button class="btn-excluir" onclick="excluirProduto(${prod.id})" style="background: none; border: none; color: #f56565; cursor: pointer; font-size: 20px;">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
        });
    }
}

async function cadastrarProduto() {
    const token = localStorage.getItem('token');
    
    // Monta o objeto DTO que o Back-end espera
    const dto = {
        nome: document.getElementById('prodNome').value,
        codigoBarras: document.getElementById('prodCodigo').value,
        categoria: document.getElementById('prodCategoria').value,
        descricao: document.getElementById('prodDescricao').value
    };

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/produtos/cadastro`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (resposta.ok) {
            alert("Produto cadastrado com sucesso!");
            document.getElementById('formProduto').reset(); // Limpa o formulário
            carregarProdutos(); // Atualiza a tela automaticamente
        } else {
            const erroMsg = await resposta.text();
            alert("Erro ao cadastrar: " + erroMsg);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
    }
}

async function excluirProduto(id) {
    if (!confirm("Tem certeza que deseja apagar este produto definitivamente?")) return;

    const token = localStorage.getItem('token');
    try {
        const resposta = await fetch(`${API_BASE_URL}/api/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
            carregarProdutos(); // Atualiza a tela
        } else {
            alert("Não foi possível excluir o produto.");
        }
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
    }
}

// Envia a requisição para mudar o status (Aprovar/Rejeitar)
async function alterarStatusProduto(produtoId, novoStatus) {
    const token = localStorage.getItem('token');
    
    try {
        const resposta = await fetch(`${API_BASE_URL}/api/produtos/${produtoId}/status?status=${novoStatus}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (resposta.ok) {
            carregarProdutos(); // Recarrega a tela, movendo o produto de card
        } else {
            alert("Erro ao atualizar o status do produto.");
        }
    } catch (erro) {
        console.error("Erro na aprovação:", erro);
    }
}

// --- LÓGICA DE ESTABELECIMENTOS ---
async function carregarMercadosPendentes() {
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_BASE_URL}/api/estabelecimentos/pendentes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lista = await resp.json();
        const container = document.getElementById('mercadosPendentes');
        
        container.innerHTML = lista.length === 0 ? '<p>Nenhuma solicitação.</p>' : lista.map(m => `
            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 5px; border-radius: 8px;">
                <strong>${m.nome}</strong> (${m.descricao || 'Sem endereço'})
                <button onclick="aprovarMercado(${m.id})" style="margin-left: 10px;">Aprovar</button>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function aprovarMercado(id) {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/estabelecimentos/${id}/aprovar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    carregarMercadosPendentes();
}

async function cadastrarMercadoDireto() {
    const nome = document.getElementById('novoNomeMercado').value;
    const token = localStorage.getItem('token');
    
    if(!nome) return alert("Nome obrigatório");

    await fetch(`${API_BASE_URL}/api/estabelecimentos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    });
    alert("Cadastrado com sucesso!");
    document.getElementById('novoNomeMercado').value = '';
}