// Bloco para a troca de temas do site (dark mode)
document.addEventListener('DOMContentLoaded', () => {
    const btnTema = document.getElementById('btnTema');
    const htmlElement = document.documentElement;

    btnTema.addEventListener('click', () => {
        const temaAtual = htmlElement.getAttribute('data-bs-theme');
        
        if (temaAtual === 'dark') {
            htmlElement.setAttribute('data-bs-theme', 'light');
            btnTema.innerHTML = '<span id="temaIcon">🌙</span>';
        } else {
            htmlElement.setAttribute('data-bs-theme', 'dark');
            btnTema.innerHTML = '<span id="temaIcon">☀️</span>';
        }
    });
});