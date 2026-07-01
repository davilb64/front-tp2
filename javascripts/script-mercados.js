let listasUsuario = [];
let listaSelecionadaId = null;
let originalDados = []; 
let dadosComparacao = []; 
let minhaLat = null, minhaLon = null;
let map, marker;
let markersLayer = L.layerGroup();

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do Mapa
    map = L.map('map').setView([-15.7801, -47.9292], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    markersLayer.addTo(map);

    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');

    if (!token || !usuarioId) {
        alert("Sessão expirada.");
        window.location.href = 'index.html';
        return;
    }

    carregarListas();

    // Filtro de Busca
    document.getElementById('filtroMercado').addEventListener('input', function(e) {
        const termo = e.target.value.toLowerCase();
        dadosComparacao = originalDados.filter(m => 
            m.nomeEstabelecimento.toLowerCase().includes(termo)
        );
        renderizarMercados(dadosComparacao);
    });

    // Evento de clique no mapa
    map.on('click', (e) => {
        atualizarMapa(e.latlng.lat, e.latlng.lng, true);
    });
});

function atualizarMapa(lat, lon, recarregar = false) {
    minhaLat = lat;
    minhaLon = lon;
    map.setView([lat, lon], 15);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map);
    if (recarregar && originalDados.length > 0) processarDistancias();
}

async function obterLocalizacao() {
    if (!("geolocation" in navigator)) return alert("GPS não suportado.");
    
    navigator.geolocation.getCurrentPosition((pos) => {
        atualizarMapa(pos.coords.latitude, pos.coords.longitude, true);
        alert("Localização atualizada!");
    }, (err) => {
        console.error(err);
        alert("Permissão de GPS negada.");
    });
}

async function buscarPorEndereco() {
    const endereco = document.getElementById('enderecoManual').value;
    if (!endereco) {
        alert("Digite um endereço!");
        return;
    }

    const btn = document.querySelector('button[onclick="buscarPorEndereco()"]');
    btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i>';

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            atualizarMapa(parseFloat(data[0].lat), parseFloat(data[0].lon), true);
            alert("Localização encontrada!");
        } else {
            alert("Endereço não encontrado.");
        }
    } catch (error) {
        alert("Erro ao buscar endereço.");
    } finally {
        btn.innerHTML = 'Buscar';
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function processarDistancias() {
    originalDados.forEach(comp => {
        if (comp.latitude && comp.longitude && minhaLat) {
            comp.distanciaKm = calcularDistancia(minhaLat, minhaLon, parseFloat(comp.latitude), parseFloat(comp.longitude));
        } else {
            comp.distanciaKm = 999999;
        }
    });
    
    // Atualiza a lista de cards
    dadosComparacao = [...originalDados];
    renderizarMercados(dadosComparacao);
    
    // Atualiza os marcadores no mapa (NOVO)
    desenharMarcadoresNoMapa();
}

function desenharMarcadoresNoMapa() {
    markersLayer.clearLayers(); // Limpa os pins antigos

    originalDados.forEach(comp => {
        // Verifica se tem coordenadas e se está no raio de 100km
        if (comp.latitude && comp.longitude && comp.distanciaKm <= 100) {
            L.marker([parseFloat(comp.latitude), parseFloat(comp.longitude)], {
                // Estilo para destacar (podemos usar um ícone diferente se desejar)
                title: comp.nomeEstabelecimento
            })
            .bindPopup(`
                <div style="text-align: center;">
                    <b>${comp.nomeEstabelecimento}</b><br>
                    Total: R$ ${comp.valorTotal.toFixed(2).replace('.', ',')}<br>
                    <small>${comp.distanciaKm.toFixed(1)} km de distância</small>
                </div>
            `)
            .addTo(markersLayer);
        }
    });
}

async function carregarListas() {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    const resp = await fetch(`${API_BASE_URL}/api/listas/usuario/${usuarioId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (resp.ok) {
        listasUsuario = await resp.json();
        const seletor = document.getElementById('seletor-listas-mercado');
        if (listasUsuario.length > 0) {
            seletor.innerHTML = listasUsuario.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
            listaSelecionadaId = listasUsuario[listasUsuario.length - 1].id;
            seletor.value = listaSelecionadaId;
            carregarComparacao();
        }
    }
}

async function carregarComparacao() {
    listaSelecionadaId = document.getElementById('seletor-listas-mercado').value;
    const token = localStorage.getItem('token');
    
    const resp = await fetch(`${API_BASE_URL}/api/listas/${listaSelecionadaId}/comparacao`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (resp.ok) {
        originalDados = await resp.json();
        processarDistancias(); 
    }
}

function renderizarMercados(lista) {
    const container = document.getElementById('listaMercadosContainer');
    container.innerHTML = '';

    lista.forEach(comp => {
        const valorFormatado = comp.valorTotal.toFixed(2).replace('.', ',');
        const distTexto = comp.distanciaKm && comp.distanciaKm < 99999 ? `${comp.distanciaKm.toFixed(1)} km` : '--';
        
        container.innerHTML += `
            <div class="card" style="padding: 15px; border-radius: 12px; border-left: 5px solid var(--roxo-principal);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px;">${comp.nomeEstabelecimento}</h3>
                    <span style="font-size: 12px; color: #6b7280;"><i class="ph ph-navigation-arrow"></i> ${distTexto}</span>
                </div>
                <div style="font-size: 20px; font-weight: bold; margin: 10px 0; color: var(--roxo-principal);">R$ ${valorFormatado}</div>
                <div style="font-size: 13px; color: ${comp.mensagem === 'Lista completa!' ? '#059669' : '#d97706'}; margin-bottom: 15px;">
                    <i class="ph ${comp.mensagem === 'Lista completa!' ? 'ph-check-circle' : 'ph-warning'}"></i> ${comp.mensagem}
                </div>
                <button class="btn-customizado" style="width: 100%;" onclick="iniciarCompras(${comp.estabelecimentoId})">Ir para o Mercado</button>
            </div>
        `;
    });
}

function ordenarMercados(tipo) {
    document.querySelectorAll('.btn-ordenacao').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (tipo === 'preco') {
        dadosComparacao.sort((a, b) => a.valorTotal - b.valorTotal);
    } else {
        if (!minhaLat) { alert("Ative o GPS primeiro!"); return; }
        dadosComparacao.sort((a, b) => (a.distanciaKm || 99999) - (b.distanciaKm || 99999));
    }
    renderizarMercados(dadosComparacao);
}

function iniciarCompras(mercadoId) {
    localStorage.setItem('checkinListaId', listaSelecionadaId);
    localStorage.setItem('checkinMercadoId', mercadoId);
    window.location.href = 'modo-compras.html';
}

async function enviarSugestao() {
    const nome = document.getElementById('sugestaoNome').value;
    const endereco = document.getElementById('sugestaoEndereco').value;
    const token = localStorage.getItem('token');

    if (!nome) return alert("Nome é obrigatório.");

    try {
        const resp = await fetch(`${API_BASE_URL}/api/estabelecimentos/solicitar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, descricao: endereco })
        });
        
        if (resp.ok) {
            alert("Sugestão enviada para análise!");
            document.getElementById('modalSugestao').style.display = 'none';
        } else {
            alert("Erro ao enviar sugestão.");
        }
    } catch (e) {
        console.error(e);
    }
}