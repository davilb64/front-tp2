document.addEventListener('DOMContentLoaded', () => {
    // Olha localStorage para ver se tem alguém logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        alert("Acesso negado. Por favor, faça login.");
        window.location.href = 'login.html'; // Expulsa para o login
        return;
    }

    // Se estiver tudo certo, mostra os dados do usuário na tela
    document.getElementById('perfil-usuario').innerHTML = `👤 ${usuarioLogado}`;
    document.getElementById('email-display').innerText = usuarioLogado;

    // Lógica do botão "Sair" (Logout)
    document.getElementById('btn-sair').addEventListener('click', function(evento) {
        evento.preventDefault();
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html'; // Redireciona para o login
    });
});