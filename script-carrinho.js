// ========== DADOS ==========
let carrinho = [];
let proximoId = 1;

// ========== CARREGAR DADOS ==========
function carregarCarrinho() {
    const salvo = localStorage.getItem('carrinhoColetivo');
    if (salvo) {
        carrinho = JSON.parse(salvo);
        if (carrinho.length > 0) {
            proximoId = Math.max(...carrinho.map(item => item.id)) + 1;
        }
        atualizarLista();
    }
}

// ========== ADICIONAR ITEM ==========
function adicionarItem() {
    const input = document.getElementById('novoItem');
    const nome = input.value.trim();
    
    if (!nome) {
        alert('Digite o nome do produto!');
        return;
    }
    
    // Verifica se já existe
    const existente = carrinho.find(item => item.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
        existente.quantidade++;
        atualizarLista();
        input.value = '';
        return;
    }
    
    const novoItem = {
        id: proximoId++,
        nome: nome,
        preco: Math.round((Math.random() * 20 + 2) * 100) / 100, // Preço aleatório
        quantidade: 1
    };
    
    carrinho.push(novoItem);
    atualizarLista();
    salvarCarrinho();
    input.value = '';
}

// ========== ATUALIZAR LISTA ==========
function atualizarLista() {
    const lista = document.getElementById('listaItens');
    
    if (carrinho.length === 0) {
        lista.innerHTML = '<li style="text-align: center; color: var(--texto-cinza); padding: 20px;">Carrinho vazio</li>';
        atualizarTotais();
        return;
    }
    
    lista.innerHTML = carrinho.map(item => `
        <li>
            <div class="item-info">
                <span class="item-nome">${item.nome}</span>
                <span class="item-preco">R$ ${item.preco.toFixed(2)}</span>
            </div>
            <div class="item-quantidade">
                <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, -1)">−</button>
                <span class="qtd-valor">${item.quantidade}</span>
                <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, 1)">+</button>
            </div>
            <button class="btn-remover-item" onclick="removerItem(${item.id})">✕</button>
        </li>
    `).join('');
    
    atualizarTotais();
    atualizarResumo();
}

// ========== ALTERAR QUANTIDADE ==========
function alterarQuantidade(id, delta) {
    const item = carrinho.find(i => i.id === id);
    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            removerItem(id);
        } else {
            atualizarLista();
            salvarCarrinho();
        }
    }
}

// ========== REMOVER ITEM ==========
function removerItem(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarLista();
    salvarCarrinho();
}

// ========== TOTAIS ==========
function atualizarTotais() {
    const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('quantidadeItens').textContent = totalItens;
    document.getElementById('totalFinal').textContent = `R$ ${subtotal.toFixed(2)}`;
}

// ========== RESUMO ==========
function atualizarResumo() {
    const resumo = document.getElementById('resumoCompra');
    
    if (carrinho.length === 0) {
        resumo.innerHTML = '<p style="color: var(--texto-cinza);">Adicione itens ao carrinho para ver o resumo aqui.</p>';
        return;
    }
    
    resumo.innerHTML = carrinho.map(item => `
        <div class="resumo-item">
            <span>${item.nome} x${item.quantidade}</span>
            <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
        </div>
    `).join('');
}

// ========== SALVAR ==========
function salvarCarrinho() {
    localStorage.setItem('carrinhoColetivo', JSON.stringify(carrinho));
}

// ========== LIMPAR ==========
function limparCarrinho() {
    if (confirm('Tem certeza que quer limpar todo o carrinho?')) {
        carrinho = [];
        atualizarLista();
        salvarCarrinho();
    }
}

// ========== COMPARTILHAR PREÇO ==========
function abrirCompartilharPreco() {
    document.getElementById('modalCompartilhar').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalCompartilhar').style.display = 'none';
}

function enviarCompartilhamento() {
    const produto = document.getElementById('modalProduto').value.trim();
    const preco = parseFloat(document.getElementById('modalPreco').value);
    const supermercado = document.getElementById('modalSupermercado').value.trim();
    
    if (!produto || !preco || !supermercado) {
        alert('Preencha todos os campos!');
        return;
    }
    
    // Simula envio
    alert(`✅ Preço compartilhado!\nProduto: ${produto}\nPreço: R$ ${preco.toFixed(2)}\nSupermercado: ${supermercado}\n\n🎉 Você ganhou 10 pontos!`);
    
    // Limpa campos e fecha modal
    document.getElementById('modalProduto').value = '';
    document.getElementById('modalPreco').value = '';
    document.getElementById('modalSupermercado').value = '';
    fecharModal();
}

// ========== INICIAR ==========
document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
});