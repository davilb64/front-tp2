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

    // Código de Barras
    
    function aoLerCodigoComSucesso(textoDecodificado, resultadoDecodificado) {
        document.getElementById('resultado-leitura').innerText = textoDecodificado;
        
        console.log(`Código lido: ${textoDecodificado}`);
        
        html5QrcodeScanner.pause();
    }

    function aoFalharLeitura(erroDeMensagem) {
        // A biblioteca tenta ler vários frames por segundo e falha na maioria.
        // O ideal é deixar esta função vazia ou apenas com console.warn para depuração.
    }

    // Configurações do scanner
    const configScanner = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Formato retangular para código de barras
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    // Inicializa a biblioteca vinculando à div 'leitor-camera'
    const html5QrcodeScanner = new Html5QrcodeScanner("leitor-camera", configScanner, /* verbose= */ false);
    
    // Inicia a renderização
    html5QrcodeScanner.render(aoLerCodigoComSucesso, aoFalharLeitura);
});