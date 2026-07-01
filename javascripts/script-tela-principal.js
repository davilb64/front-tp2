document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const token = localStorage.getItem('token');

    // 1. Proteção de Rota: Se não tiver token, expulsa de volta pro login
    if (!usuarioLogado || !token) {
        alert("Acesso negado. Por favor, faça login.");
        window.location.href = 'index.html'; 
        return;
    }

    // 2. Injeta o e-mail na mensagem de boas-vindas no meio da tela
    const emailDisplay = document.getElementById('email-display');
    if (emailDisplay) {
        emailDisplay.innerText = usuarioLogado;
    }

    // ==========================================
    // FUTURO DASHBOARD DO USUÁRIO
    // ==========================================
    // Em breve, adicionaremos aqui o fetch() para buscar 
    // as últimas listas de compras e o histórico de XP do usuário.
});