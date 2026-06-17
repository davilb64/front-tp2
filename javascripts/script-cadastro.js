document.getElementById('form-cadastro').addEventListener('submit', function(evento) {
    evento.preventDefault(); 

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (senha !== confirmarSenha) {
        alert("As senhas não batem!");
        return; 
    }

    const dadosUsuario = {
        nome: nome,
        email: email,
        senha: senha
    };

    fetch('https://projeto-tecnicas-de-programacao-2.onrender.com/api/usuarios/cadastro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosUsuario)
    })
    .then(async (resposta) => {
        const mensagem = await resposta.text();
        if (resposta.ok) { 
            alert("Sucesso: " + mensagem);
            evento.target.reset();
            window.location.href = "index.html";
        } else {
            alert("Erro: " + mensagem);
        }
    })
    .catch((erro) => {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao servidor.");
    });
});