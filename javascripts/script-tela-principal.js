document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        alert("Acesso negado. Por favor, faça login.");
        window.location.href = 'index.html'; 
        return;
    }

    document.getElementById('perfil-usuario').innerHTML = `👤 ${usuarioLogado}`;
    document.getElementById('email-display').innerText = usuarioLogado;

    document.getElementById('btn-sair').addEventListener('click', function(evento) {
        evento.preventDefault();
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html'; 
    });

    // ==========================================
    // LÓGICA DO LEITOR DE CÓDIGO DE BARRAS CUSTOMIZADO
    // ==========================================
    
    const html5QrCode = new Html5Qrcode("leitor-camera");
    const btnIniciar = document.getElementById('btn-iniciar-leitor');
    const divCamera = document.getElementById('leitor-camera');
    const displayResultado = document.getElementById('resultado-leitura');

    btnIniciar.addEventListener('click', () => {
        // Esconde o botão e mostra a área da câmera
        btnIniciar.style.display = "none";
        divCamera.style.display = "block";
        displayResultado.innerText = "Posicione o código de barras...";

        // Inicia a câmera
        html5QrCode.start(
            { facingMode: "environment" }, // Força o uso da câmera traseira do celular
            {
                fps: 10,
                qrbox: { width: 250, height: 100 } // Retângulo ideal para código de barras
            },
            (textoDecodificado) => {
                // SUCESSO NA LEITURA
                displayResultado.innerText = textoDecodificado;
                console.log(`Código lido: ${textoDecodificado}`);
                
                // Desliga a câmera e volta a interface ao normal
                html5QrCode.stop().then(() => {
                    divCamera.style.display = "none";
                    btnIniciar.style.display = "inline-block";
                    btnIniciar.innerText = "📷 Escanear Outro Produto";
                }).catch((err) => {
                    console.log("Erro ao desligar câmera", err);
                });
            },
            (erroDeLeitura) => {
                // Ignora os erros constantes de "não encontrei código neste frame"
            }
        ).catch((err) => {
            alert("Erro ao acessar a câmera. Verifique as permissões.");
            divCamera.style.display = "none";
            btnIniciar.style.display = "inline-block";
        });
    });
});