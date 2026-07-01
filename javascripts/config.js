// URL base da API
const ambienteLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = ambienteLocal ? 'http://localhost:8080' : 'https://projeto-tecnicas-de-programacao-2.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const papel = localStorage.getItem('papelUsuario');
    const email = localStorage.getItem('usuarioLogado');
    const token = localStorage.getItem('token');
    
    const navTabs = document.querySelector('.nav-tabs');
    const perfilBadge = document.getElementById('perfil-usuario');

    // 1. Atualiza o cabeçalho em TODAS as páginas que tiverem a badge
    if (perfilBadge && email) {
        // Pega só a parte antes do @ do e-mail para ficar um nome mais curto
        const nomeCurto = email.split('@')[0];
        perfilBadge.innerHTML = `<i class="ph ph-user"></i> ${nomeCurto}`;
    }

    // 2. Injeta o menu de Admin APENAS se o usuário logado for ADMINISTRADOR
    if (navTabs && papel === 'ADMINISTRADOR') {
        const urlAtual = window.location.pathname;
        const isAdminAtivo = urlAtual.includes('admin') ? 'active' : '';
        
        navTabs.innerHTML += `
            <a href="admin-produtos.html" class="tab ${isAdminAtivo}">
                <i class="ph ph-gear"></i> Admin
            </a>
        `;
    }
});