document.getElementById('meu-form-login').addEventListener('submit', function(evento) {
    evento.preventDefault(); 

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    const dadosLogin = {
        email: email,
        senha: senha
    };

    fetch('https://projeto-tecnicas-de-programacao-2.onrender.com/api/usuarios/login', {
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
    });
});