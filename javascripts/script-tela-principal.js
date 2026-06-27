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
    // LEITOR DE CÓDIGO DE BARRAS 
    // ==========================================
    
    const html5QrCode = new Html5Qrcode("leitor-camera");
    const btnIniciar = document.getElementById('btn-iniciar-leitor');
    const divCamera = document.getElementById('leitor-camera');
    const displayResultado = document.getElementById('resultado-leitura');
    
    const controlesCamera = document.getElementById('controles-camera');
    const selectCameras = document.getElementById('lista-cameras');
    const btnParar = document.getElementById('btn-parar-leitor');

    // Função que liga a lente específica escolhida
    function iniciarCamera(cameraId) {
        html5QrCode.start(
            cameraId, 
            {
                fps: 10,
                qrbox: { width: 250, height: 100 }
            },
            (textoDecodificado) => {
                // SUCESSO
                displayResultado.innerText = textoDecodificado;
                console.log(`Código lido: ${textoDecodificado}`);
                
                pararCamera();
                btnIniciar.innerText = "Escanear Outro Produto";
            },
            (erro) => { /* Ignora os quadros sem código */ }
        ).catch((err) => {
            alert("Erro ao acessar a lente: " + err);
            pararCamera();
        });
    }

    // Desliga tudo e esconde os vídeos
    function pararCamera() {
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                divCamera.style.display = "none";
                controlesCamera.style.display = "none";
                btnIniciar.style.display = "inline-block";
            });
        }
    }

    // Ação do Botão "Começar"
    btnIniciar.addEventListener('click', () => {
        btnIniciar.style.display = "none";
        displayResultado.innerText = "Buscando câmeras...";

        // Pede permissão e busca todas as lentes do celular
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                selectCameras.innerHTML = ''; // Limpa a lista
                
                // Cria as opções no select
                devices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.text = device.label || `Câmera ${selectCameras.length + 1}`;
                    selectCameras.appendChild(option);
                });

                let cameraTraseira = devices.find(d => d.label.toLowerCase().includes('back') && !d.label.toLowerCase().includes('ultrawide'));
                if(cameraTraseira) {
                    selectCameras.value = cameraTraseira.id;
                }

                // Mostra a interface e inicia
                controlesCamera.style.display = "flex";
                divCamera.style.display = "block";
                displayResultado.innerText = "Posicione o código de barras...";
                
                iniciarCamera(selectCameras.value);
            } else {
                alert("Nenhuma câmera encontrada.");
                btnIniciar.style.display = "inline-block";
            }
        }).catch(err => {
            alert("Permissão de câmera negada.");
            btnIniciar.style.display = "inline-block";
        });
    });

    // Se o usuário trocar a câmera na caixinha
    selectCameras.addEventListener('change', () => {
        if (html5QrCode.isScanning) {
            // Desliga a lente atual e liga a lente nova
            html5QrCode.stop().then(() => {
                iniciarCamera(selectCameras.value);
            });
        }
    });

    // Botão de parar
    btnParar.addEventListener('click', pararCamera);
});