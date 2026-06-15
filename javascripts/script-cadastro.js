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

});