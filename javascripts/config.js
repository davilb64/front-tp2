// Verifica se a URL do navegador é localhost ou o IP local
const ambienteLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Define a URL base do back-end automaticamente
const API_BASE_URL = ambienteLocal 
    ? 'http://localhost:8080' 
    : 'https://projeto-tecnicas-de-programacao-2.onrender.com';