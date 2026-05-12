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

$cruCallback('onChamadoSubmit', (res, el) => {
    const mensagemForm = document.getElementById('mensagemForm');
    if (!mensagemForm) return;

    if (res.status === 201) {
        mensagemForm.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Sucesso!</strong> O chamado foi criado e a Inteligência Artificial encaminhou para o setor <strong>${res.data.setor}</strong>.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    } else {
        const erroMsg = res.data.erro || "Ocorreu um erro desconhecido.";
        mensagemForm.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Não foi possível criar o chamado!</strong><br> ${erroMsg}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
});