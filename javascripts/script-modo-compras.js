let listaId = localStorage.getItem('checkinListaId');
let mercadoId = localStorage.getItem('checkinMercadoId');
let usuarioId = localStorage.getItem('usuarioId');
let itensDaLista = [];
let totalCarrinho = 0.0;

document.addEventListener('DOMContentLoaded', () => {
    if (!listaId || !mercadoId || !usuarioId) {
        alert("Sessão de compras inválida.");
        sairModoCompras();
        return;
    }
    carregarItensDaLista();
    buscarNomeMercado();
});

async function carregarItensDaLista() {
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_BASE_URL}/api/listas/usuario/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const listas = await resp.json();
        const listaAtual = listas.find(l => l.id == listaId);
        
        if (listaAtual) {
            itensDaLista = listaAtual.itens;
            await enriquecerItensComPrecos(); // Busca as estimativas
            renderizarItensCompras();
        }
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
    }
}

// Busca as estimativas de preço (Exato ou Média) para CADA item da lista
async function enriquecerItensComPrecos() {
    const token = localStorage.getItem('token');
    
    // Promise.all faz todas as requisições em paralelo para ser super rápido
    await Promise.all(itensDaLista.map(async (item) => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/precos/estimativa/${item.variacaoId}?estabelecimentoId=${mercadoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const estimativa = await resp.json();
                item.precoEstimado = estimativa.valor;
                item.tipoEstimativa = estimativa.tipo;
            } else {
                item.precoEstimado = 0;
                item.tipoEstimativa = "NENHUM";
            }
        } catch (e) {
            item.precoEstimado = 0;
            item.tipoEstimativa = "NENHUM";
        }
    }));
}

function renderizarItensCompras() {
    const container = document.getElementById('listaItensCompras');
    container.innerHTML = '';
    totalCarrinho = 0; // Reseta para recalcular
    
    const pendentes = itensDaLista.filter(i => !i.comprado);
    const comprados = itensDaLista.filter(i => i.comprado);
    const todosItens = [...pendentes, ...comprados];

    todosItens.forEach(item => {
        const isChecked = item.comprado ? 'checked' : '';
        const classeStatus = item.comprado ? 'comprado' : '';
        
        // Renderização do Badge de Preço
        let badgeHtml = '';
        if (item.tipoEstimativa === 'EXATO_MERCADO') {
            badgeHtml = `<span class="badge-preco badge-exato"><i class="ph ph-storefront"></i> R$ ${item.precoEstimado.toFixed(2).replace('.', ',')}</span>`;
        } else if (item.tipoEstimativa === 'MEDIA_GERAL') {
            badgeHtml = `<span class="badge-preco badge-media"><i class="ph ph-chart-line-up"></i> Média: R$ ${item.precoEstimado.toFixed(2).replace('.', ',')}</span>`;
        } else {
            badgeHtml = `<span class="badge-preco badge-nenhum"><i class="ph ph-question"></i> Sem preço</span>`;
        }

        // Soma no carrinho se já estiver comprado
        if (item.comprado) {
            totalCarrinho += (item.precoEstimado * item.quantidade);
        }
        
        container.innerHTML += `
            <div class="item-compra ${classeStatus}" id="card-item-${item.id}">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <input type="checkbox" style="width: 24px; height: 24px; accent-color: var(--roxo-principal);" 
                           ${isChecked} 
                           onchange="processarCheckItem(${item.id}, ${item.variacaoId}, this.checked, '${item.nomeProduto} - ${item.descricaoVariacao}', ${item.precoEstimado}, '${item.tipoEstimativa}')">
                    
                    <div style="display: flex; flex-direction: column;" class="texto-item">
                        <strong style="font-size: 16px;">${item.quantidade}x ${item.nomeProduto}</strong>
                        <span style="font-size: 12px; color: gray;">${item.descricaoVariacao}</span>
                        <div>${badgeHtml}</div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('valorTotalCarrinho').innerText = totalCarrinho.toFixed(2).replace('.', ',');
}

// Ao clicar no checkbox...
async function processarCheckItem(itemId, variacaoId, isComprado, nomeDescricao, precoBase, tipoEstimativa) {
    const token = localStorage.getItem('token');
    
    // 1. Atualiza no Back-end que riscou/desriscou a lista
    await fetch(`${API_BASE_URL}/api/listas/itens/${itemId}/check`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (isComprado) {
        // 2. Abre o modal lindo!
        abrirModalPreco(itemId, variacaoId, nomeDescricao, precoBase, tipoEstimativa);
    } else {
        // Se desmarcou, recarrega a lista para remover do total
        carregarItensDaLista();
    }
}

function abrirModalPreco(itemId, variacaoId, nomeDescricao, precoBase, tipoEstimativa) {
    document.getElementById('modalItemId').value = itemId;
    document.getElementById('modalVariacaoId').value = variacaoId;
    document.getElementById('modalNomeProduto').innerText = nomeDescricao;
    
    const inputPreco = document.getElementById('inputPrecoPrateleira');
    const avisoMedia = document.getElementById('modalAvisoMedia');

    // Mágica de UX: Se já tem um preço base (mesmo sendo média), já preenche pro usuário!
    if (precoBase > 0) {
        inputPreco.value = precoBase;
    } else {
        inputPreco.value = '';
    }

    // Se for média, mostra o aviso laranja destacado
    if (tipoEstimativa === 'MEDIA_GERAL') {
        avisoMedia.style.display = 'block';
    } else {
        avisoMedia.style.display = 'none';
    }

    document.getElementById('modalPrecoItem').style.display = 'flex';
}

function fecharModalPreco() {
    document.getElementById('modalPrecoItem').style.display = 'none';
    carregarItensDaLista(); // Recarrega para aplicar a soma usando a estimativa antiga
}

async function salvarPrecoModal() {
    const itemId = parseInt(document.getElementById('modalItemId').value);
    const variacaoId = parseInt(document.getElementById('modalVariacaoId').value);
    const valorDigitado = document.getElementById('inputPrecoPrateleira').value;

    const valorFormatado = parseFloat(valorDigitado.replace(',', '.'));
            
    if (isNaN(valorFormatado) || valorFormatado <= 0) {
        alert("Digite um valor válido maior que zero.");
        return;
    }

    const token = localStorage.getItem('token');
    const dtoPreco = {
        variacaoId: variacaoId,
        estabelecimentoId: parseInt(mercadoId),
        usuarioId: parseInt(usuarioId),
        valor: valorFormatado
    };

    try {
        await fetch(`${API_BASE_URL}/api/precos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dtoPreco)
        });
        
        fecharModalPreco();
        // O recarregamento dentro do fecharModal vai chamar a API de novo,
        // mas agora o back-end vai retornar "EXATO_MERCADO" com o valor atualizado!
    } catch (e) {
        alert("Erro ao salvar o preço na comunidade.");
        console.error(e);
    }
}

function sairModoCompras() {
    localStorage.removeItem('checkinListaId');
    localStorage.removeItem('checkinMercadoId');
    window.location.href = "listas.html";
}

// ==========================================
// FUNÇÕES DE CABEÇALHO E FINALIZAÇÃO
// ==========================================

// Puxa o nome do mercado do Back-end para exibir no header
async function buscarNomeMercado() {
    const token = localStorage.getItem('token');
    try {
        // Supondo que você tenha a rota GET /api/estabelecimentos/{id}
        const resp = await fetch(`${API_BASE_URL}/api/estabelecimentos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
            const mercados = await resp.json();
            const mercadoAtual = mercados.find(m => m.id == mercadoId);
            if (mercadoAtual) {
                document.getElementById('nomeMercadoHeader').innerHTML = `<i class="ph ph-storefront"></i> ${mercadoAtual.nome}`;
            }
        }
    } catch (e) {
        document.getElementById('nomeMercadoHeader').innerText = "Modo Compras";
    }
}

// Abre o modal de finalização
function abrirModalFinalizar() {
    // Pega o total calculado e joga no modal
    const totalFormatado = totalCarrinho.toFixed(2);
    document.getElementById('modalTotalEstimado').innerText = totalFormatado.replace('.', ',');
    
    // Já preenche o input com o valor estimado para facilitar a vida do usuário
    document.getElementById('inputTotalPago').value = totalFormatado;
    
    document.getElementById('modalFinalizarCompra').style.display = 'flex';
}

function fecharModalFinalizar() {
    document.getElementById('modalFinalizarCompra').style.display = 'none';
}

// Confirmação final da nota fiscal
async function confirmarPagamentoFinal() {
    const valorDigitado = document.getElementById('inputTotalPago').value;
    const valorPago = parseFloat(valorDigitado.replace(',', '.'));

    if (isNaN(valorPago) || valorPago <= 0) {
        alert("Digite um valor válido para a nota fiscal.");
        return;
    }

    // Calcula a diferença entre o que o app achou que ia dar e o que realmente deu
    const diferenca = Math.abs(totalCarrinho - valorPago);
    

    // Simulação de Gamificação
    alert(`Compra finalizada com sucesso!\n\nA diferença da estimativa foi de apenas R$ ${diferenca.toFixed(2).replace('.', ',')}.`);
    
    // Limpa a sessão do modo compras
    localStorage.removeItem('checkinListaId');
    localStorage.removeItem('checkinMercadoId');
    
    // Joga o usuário de volta para a tela inicial
    window.location.href = "listas.html";
}