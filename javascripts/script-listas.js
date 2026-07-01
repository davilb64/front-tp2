let html5QrCode;
let minhasListas = [];
let listaAtualId = null;
let catalogoProdutos = [];
let produtoIdSelecionado = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');

    // Validação estrita: se faltar token OU o id do usuário, força re-login
    if (!token || !usuarioId) {
        alert("Sua sessão expirou ou foi atualizada. Por favor, faça login novamente.");
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    carregarMinhasListas();
    document.getElementById('btn-abrir-leitor').addEventListener('click', iniciarCamera);
});

// ==========================================
// GERENCIAMENTO DAS LISTAS
// ==========================================

async function carregarMinhasListas() {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    const seletor = document.getElementById('seletor-listas');

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/listas/usuario/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
            minhasListas = await resposta.json();
            
            if (minhasListas.length > 0) {
                seletor.innerHTML = minhasListas.map(lista => 
                    `<option value="${lista.id}">${lista.nome}</option>`
                ).join('');

                // Se não tem lista selecionada ou a que estava foi apagada, pega a última do array
                if(!listaAtualId || !minhasListas.find(l => l.id == listaAtualId)) {
                    listaAtualId = minhasListas[minhasListas.length - 1].id; 
                }
                seletor.value = listaAtualId;
                mudarListaAtiva(); 

            } else {
                seletor.innerHTML = '<option value="">Nenhuma lista encontrada.</option>';
                document.getElementById('listaItens').innerHTML = '<li style="text-align: center; color: var(--texto-cinza); padding: 20px;">Você ainda não tem listas. Clique em "+ Nova" para começar!</li>';
                document.getElementById('totalItensBadge').innerText = 0;
            }
        } else {
            seletor.innerHTML = '<option value="">Erro ao carregar listas.</option>';
        }
    } catch (erro) {
        console.error("Erro ao carregar listas:", erro);
        seletor.innerHTML = '<option value="">Erro de conexão.</option>';
    }
}

function mudarListaAtiva() {
    const seletor = document.getElementById('seletor-listas');
    listaAtualId = parseInt(seletor.value);
    
    const listaEncontrada = minhasListas.find(l => l.id === listaAtualId);
    if (listaEncontrada) {
        renderizarItens(listaEncontrada.itens);
    }
}

// ==========================================
// MODAL NOVA LISTA
// ==========================================

function abrirModalNovaLista() {
    document.getElementById('modalNovaLista').style.display = 'flex'; 
    const inputNome = document.getElementById('inputNomeNovaLista');
    inputNome.value = '';
    setTimeout(() => inputNome.focus(), 100);
}

function fecharModalNovaLista() {
    // Altere para 'none' para esconder
    document.getElementById('modalNovaLista').style.display = 'none';
}

async function confirmarNovaLista() {
    const nomeLista = document.getElementById('inputNomeNovaLista').value.trim();
    if (!nomeLista) {
        alert("Por favor, digite um nome para a lista.");
        return;
    }

    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    const dto = { usuarioId: parseInt(usuarioId), nome: nomeLista };

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/listas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (resposta.ok) {
            fecharModalNovaLista();
            listaAtualId = null; // Força a selecionar a nova ao recarregar
            carregarMinhasListas();
        } else {
            alert("Erro ao criar lista.");
        }
    } catch (erro) {
        console.error("Erro ao criar lista:", erro);
    }
}

async function deletarListaAtual() {
    if (!listaAtualId) return;
    if (!confirm("Tem certeza que deseja apagar esta lista inteira?")) return;

    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/listas/${listaAtualId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    listaAtualId = null;
    carregarMinhasListas();
}

// ==========================================
// RENDERIZAÇÃO E ITENS
// ==========================================

function renderizarItens(itens) {
    const container = document.getElementById('listaItens');
    document.getElementById('totalItensBadge').innerText = itens ? itens.length : 0;
    container.innerHTML = '';
    
    if (!itens || itens.length === 0) {
        container.innerHTML = '<li style="text-align: center; color: var(--texto-cinza); padding: 20px;">Lista vazia. Adicione produtos!</li>';
        return;
    }

    itens.forEach(item => {
        const isChecked = item.comprado ? 'checked' : '';
        const textStyle = item.comprado ? 'text-decoration: line-through; color: gray;' : '';
        
        const nomeCompleto = `${item.nomeProduto} - ${item.descricaoVariacao}`;

        container.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--borda); border-radius: 8px; margin-bottom: 8px; background: white;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" style="width: 18px; height: 18px;" ${isChecked} onchange="alternarComprado(${item.id})">
                    <span style="${textStyle}; font-size: 15px;"><strong>${item.quantidade}x</strong> ${nomeCompleto}</span>
                </div>
                <button onclick="removerItem(${item.id})" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 20px; padding: 5px;">
                    <i class="ph ph-trash"></i>
                </button>
            </li>
        `;
    });
}

async function alternarComprado(itemId) {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/listas/itens/${itemId}/check`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    carregarMinhasListas(); 
}

async function removerItem(itemId) {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/listas/itens/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    carregarMinhasListas();
}

// ==========================================
// MODAL DE BUSCA EM TEMPO REAL
// ==========================================

async function abrirModalBusca() {
    if (!listaAtualId) {
        alert("Crie ou selecione uma lista primeiro!");
        return;
    }

    document.getElementById('modalBuscaProduto').style.display = 'flex';
    document.getElementById('inputBuscaModal').value = '';
    
    if (catalogoProdutos.length === 0) {
        document.getElementById('resultadosBusca').innerHTML = '<p style="text-align:center;">Carregando catálogo...</p>';
        const token = localStorage.getItem('token');
        try {
            const resposta = await fetch(`${API_BASE_URL}/api/produtos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resposta.ok) {
                const todosProdutos = await resposta.json();
                // Aqui o front-end pode filtrar para exibir só os aprovados
                catalogoProdutos = todosProdutos.filter(p => p.status === 'APROVADO'); 
            }
        } catch (erro) {
            console.error("Erro ao buscar catálogo:", erro);
        }
    }
    filtrarProdutosModal(); 
}

function fecharModalBusca() {
    document.getElementById('modalBuscaProduto').style.display = 'none';
}

function filtrarProdutosModal() {
    const termo = document.getElementById('inputBuscaModal').value.toLowerCase();
    const container = document.getElementById('resultadosBusca');
    container.innerHTML = '';

    const filtrados = catalogoProdutos.filter(p => p.nome.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        container.innerHTML = '<p style="color: var(--texto-cinza); text-align: center;">Nenhum produto aprovado encontrado.</p>';
        return;
    }

    filtrados.forEach(prod => {
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--borda); border-radius: 8px;">
                <div>
                    <strong style="display: block; font-size: 15px;">${prod.nome}</strong>
                    <span style="font-size: 12px; color: var(--texto-cinza);">${prod.categoria || 'Geral'}</span>
                </div>
                <!-- Alterado para chamar selecionarProduto e abrir o modal de variações -->
                <button onclick="selecionarProduto(${prod.id})" class="btn-customizado-small">
                    <i class="ph ph-plus"></i> Selecionar
                </button>
            </div>
        `;
    });
}

async function adicionarProdutoNaLista(variacaoId) {
    const qtdStr = prompt("Qual a quantidade?", "1");
    if (!qtdStr) return;
    
    const qtd = parseInt(qtdStr);
    if (isNaN(qtd) || qtd < 1) {
        alert("Quantidade inválida.");
        return;
    }

    const token = localStorage.getItem('token');
    const dto = { variacaoId: variacaoId, quantidade: qtd };

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/listas/${listaAtualId}/itens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (resposta.ok) {
            fecharModalBusca();
            carregarMinhasListas();
        } else {
            const erro = await resposta.text();
            alert("Erro: " + erro);
        }
    } catch (erro) {
        console.error("Erro ao adicionar:", erro);
    }
}

// ==========================================
// LEITOR DE QR CODE E SOLICITAÇÃO AO ADMIN
// ==========================================

function iniciarCamera() {
    if (!listaAtualId) {
        alert("Crie ou selecione uma lista primeiro!");
        return;
    }

    document.getElementById('area-leitor-qr').style.display = 'block';
    html5QrCode = new Html5Qrcode("leitor-camera");

    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (codigoLido) => {
            fecharLeitor();
            solicitarCadastroAoAdmin(codigoLido);
        },
        (erro) => { }
    ).catch((err) => {
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        fecharLeitor();
    });
}

function fecharLeitor() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.getElementById('area-leitor-qr').style.display = 'none';
        });
    } else {
        document.getElementById('area-leitor-qr').style.display = 'none';
    }
}

async function solicitarCadastroAoAdmin(codigoBarras) {
    if(confirm(`Código ${codigoBarras} lido! Deseja enviar este produto para o Administrador aprovar no sistema?`)) {
        const nomeProduto = prompt("Qual o nome ou marca deste produto?");
        if(!nomeProduto) return;

        const token = localStorage.getItem('token');
        const dto = {
            nome: nomeProduto,
            codigoBarras: codigoBarras,
            categoria: "Geral", 
            descricao: "Adicionado via Scanner pelo usuário",
            criadoPorId: parseInt(localStorage.getItem('usuarioId'))
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
                alert("Produto enviado para a fila de aprovação com sucesso! Assim que aprovado, você poderá adicioná-lo.");
            } else {
                const erro = await resposta.text();
                alert("Não foi possível enviar: " + erro);
            }
        } catch (erro) {
            console.error("Erro na solicitação:", erro);
        }
    }
}

// ==========================================
// SOLICITAÇÃO E API EXTERNA (OPEN FOOD FACTS)
// ==========================================

function abrirModalSolicitar() {
    fecharModalBusca(); // Fecha o modal de pesquisa, se estiver aberto
    document.getElementById('modalSolicitarProduto').style.display = 'flex';
    document.getElementById('solicitacaoCodigo').value = '';
    document.getElementById('solicitacaoNome').value = '';
    document.getElementById('statusBuscaExterna').style.display = 'none';
}

function fecharModalSolicitar() {
    document.getElementById('modalSolicitarProduto').style.display = 'none';
}

// Consome a API pública Open Food Facts
async function buscarNaAPIExterna() {
    const inputCodigo = document.getElementById('solicitacaoCodigo');
    const statusTexto = document.getElementById('statusBuscaExterna');
    
    const codigo = inputCodigo.value.replace(/\D/g, '');
    inputCodigo.value = codigo;

    if (!codigo || codigo.length < 8) {
        statusTexto.style.display = 'block';
        statusTexto.innerText = "O código deve ter pelo menos 8 números.";
        statusTexto.style.color = "red";
        return;
    }

    statusTexto.style.display = 'block';
    statusTexto.innerText = "Buscando na base global...";
    statusTexto.style.color = "var(--roxo-principal)";

    try {
        const resposta = await fetch(`https://br.openfoodfacts.org/api/v0/product/${codigo}.json`);
        const dados = await resposta.json();

        if (dados.status === 1 && dados.product) {
            const prod = dados.product;
            
            // 1. Puxa o Nome Genérico (Produto Pai)
            const nomeBase = prod.product_name_pt || prod.product_name || prod.generic_name;
            
            // 2. Puxa a Marca (Descrição da Variação)
            const marca = prod.brands ? prod.brands.split(',')[0].trim() : 'Embalagem Padrão';
            
            // 3. Extrai Peso e Unidade usando Regex (Ex: "750g" ou "1.5 L")
            let peso = '';
            let unidade = '';
            if (prod.quantity) {
                // Procura números (com ponto ou vírgula) seguidos de letras
                const match = prod.quantity.match(/([\d.,]+)\s*([a-zA-Z]+)/);
                if (match) {
                    peso = parseFloat(match[1].replace(',', '.')); // Transforma "1,5" em "1.5"
                    unidade = match[2].toLowerCase(); // Garante que fique "g", "ml"
                }
            }

            // Preenche o formulário separadamente
            document.getElementById('solicitacaoNome').value = nomeBase || '';
            document.getElementById('solicitacaoVarDescricao').value = marca;
            document.getElementById('solicitacaoVarPeso').value = peso;
            document.getElementById('solicitacaoVarUnidade').value = unidade;
            
            statusTexto.innerText = "Produto e Variação encontrados!";
            statusTexto.style.color = "green";

        } else {
            statusTexto.innerText = "Não encontrado. A base gratuita não tem este produto.";
            statusTexto.style.color = "red";
        }
    } catch (erro) {
        console.error("Erro na API externa:", erro);
        statusTexto.innerText = "Erro de conexão. Preencha os campos manualmente.";
        statusTexto.style.color = "red";
    }
}

async function enviarSolicitacaoAdmin() {
    const nome = document.getElementById('solicitacaoNome').value.trim();
    const codigo = document.getElementById('solicitacaoCodigo').value.trim();
    const varDesc = document.getElementById('solicitacaoVarDescricao').value.trim();
    const varPeso = document.getElementById('solicitacaoVarPeso').value.trim();
    const varUnidade = document.getElementById('solicitacaoVarUnidade').value.trim();

    if (!nome) {
        alert("O nome do produto é obrigatório!");
        return;
    }

    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');

    // Montando o DTO com os novos campos de variação incluídos
    const dto = {
        nome: nome,
        codigoBarras: codigo || null,
        categoria: "Geral", 
        descricao: "Solicitado pelo usuário",
        criadoPorId: parseInt(usuarioId),
        
        variacaoDescricao: varDesc,
        variacaoPeso: varPeso ? parseFloat(varPeso) : null,
        variacaoUnidade: varUnidade || null
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
            alert("Solicitação enviada com sucesso! Assim que o Admin aprovar, aparecerá no catálogo.");
            fecharModalSolicitar();
        } else {
            const erro = await resposta.text();
            alert("Erro ao solicitar: " + erro);
        }
    } catch (erro) {
        console.error("Erro no envio:", erro);
    }
}

async function selecionarProduto(produtoId) {
    fecharModalBusca();
    produtoIdSelecionado = produtoId; // Salva o ID para usar no cadastro da variação
    
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_BASE_URL}/api/variacoes/produto/${produtoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const variacoes = await resp.json();

        const container = document.getElementById('listaVariacoes');
        container.innerHTML = '';

        if (variacoes.length > 0) {
            variacoes.forEach(v => {
                container.innerHTML += `
                    <button class="btn-secundario" onclick="adicionarVariacaoNaLista(${v.id})" style="width: 100%; text-align: left;">
                        ${v.descricao || 'Sem descrição'} (${v.peso || ''}${v.unidade || ''})
                    </button>
                `;
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--texto-cinza);">Nenhuma variação encontrada.</p>';
        }
        
        document.getElementById('modalVariacoes').style.display = 'flex';
    } catch (e) {
        console.error("Erro ao buscar variações:", e);
    }
}

function abrirModalNovaVariacaoDeDentro() {
    // Fecha o modal de seleção antes de abrir o de cadastro
    document.getElementById('modalVariacoes').style.display = 'none';
    
    // Abre o modal de cadastro e passa o ID do produto que salvamos antes
    document.getElementById('hiddenProdutoId').value = produtoIdSelecionado;
    document.getElementById('modalNovaVariacao').style.display = 'flex';
}

function abrirModalNovaVariacao(produtoId) {
    document.getElementById('hiddenProdutoId').value = produtoId;
    document.getElementById('modalNovaVariacao').style.display = 'flex';
}

function fecharModalNovaVariacao() {
    document.getElementById('modalNovaVariacao').style.display = 'none';
}

async function enviarNovaVariacao() {
    const token = localStorage.getItem('token');
    const dto = {
        produtoId: parseInt(document.getElementById('hiddenProdutoId').value),
        descricao: document.getElementById('varDescricao').value,
        peso: document.getElementById('varPeso').value,
        unidade: document.getElementById('varUnidade').value,
        codigoBarras: document.getElementById('varCodigo').value
    };

    const resp = await fetch(`${API_BASE_URL}/api/variacoes/cadastro`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dto)
    });

    if (resp.ok) {
        alert("Variação cadastrada!");
        fecharModalNovaVariacao();
        
        selecionarProduto(document.getElementById('hiddenProdutoId').value);
    } else {
        alert("Erro ao cadastrar variação.");
    }
}

async function adicionarVariacaoNaLista(variacaoId) {
    // 1. Pergunta a quantidade
    const qtdStr = prompt("Qual a quantidade?", "1");
    if (!qtdStr) return;
    
    const qtd = parseInt(qtdStr);
    if (isNaN(qtd) || qtd < 1) {
        alert("Quantidade inválida.");
        return;
    }

    // 2. Faz o POST para o servidor
    const token = localStorage.getItem('token');
    const dto = { variacaoId: variacaoId, quantidade: qtd };

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/listas/${listaAtualId}/itens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });

        if (resposta.ok) {
            // 3. Sucesso: fecha o modal e recarrega a lista
            document.getElementById('modalVariacoes').style.display = 'none';
            carregarMinhasListas(); // Isso já vai atualizar a lista com o item somado
        } else {
            const erro = await resposta.text();
            alert("Erro: " + erro);
        }
    } catch (erro) {
        console.error("Erro ao adicionar:", erro);
        alert("Falha na conexão com o servidor.");
    }
}

// ==========================================
// CHECK-IN / MODO COMPRAS
// ==========================================

async function abrirModalCheckin() {
    if (!listaAtualId) {
        alert("Selecione uma lista primeiro!");
        return;
    }
    
    document.getElementById('modalCheckin').style.display = 'flex';
    
    // Carrega os mercados do Back-end
    const token = localStorage.getItem('token');
    const seletor = document.getElementById('seletor-mercado-checkin');
    
    try {
        const resp = await fetch(`${API_BASE_URL}/api/estabelecimentos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resp.ok) {
            const mercados = await resp.json();
            if(mercados.length > 0) {
                seletor.innerHTML = '<option value="">Escolha o mercado...</option>' + 
                    mercados.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');
            } else {
                seletor.innerHTML = '<option value="">Nenhum mercado cadastrado.</option>';
            }
        }
    } catch (e) {
        console.error("Erro ao carregar mercados:", e);
    }
}

function fecharModalCheckin() {
    document.getElementById('modalCheckin').style.display = 'none';
}

function iniciarModoCompras() {
    const mercadoId = document.getElementById('seletor-mercado-checkin').value;
    if (!mercadoId) {
        alert("Por favor, selecione em qual mercado você está.");
        return;
    }
    
    // Salva o estado atual e redireciona para a tela mobile-first
    localStorage.setItem('checkinListaId', listaAtualId);
    localStorage.setItem('checkinMercadoId', mercadoId);
    
    window.location.href = "modo-compras.html";
}