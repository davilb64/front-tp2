document.getElementById('meu-form-login').addEventListener('submit', function(evento) {
    evento.preventDefault(); 

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const btnSubmit = evento.target.querySelector('.login-button');

    // Carregamento
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Carregando...";
    btnSubmit.style.cursor = "not-allowed";
    btnSubmit.style.opacity = "0.7";

    const dadosLogin = {
        email: email,
        senha: senha
    };

    fetch(`${API_BASE_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosLogin)
    })
    .then(async (resposta) => {
        const mensagem = await resposta.text();
        
        if (resposta.ok) { 
            localStorage.setItem('usuarioLogado', email);
            window.location.href = "tela-principal.html";
        } else {
            alert("Erro: " + mensagem);
        }
    })
    .catch((erro) => {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao servidor.");
    })
    .finally(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Entrar";
        btnSubmit.style.cursor = "pointer";
        btnSubmit.style.opacity = "1";
    });
});