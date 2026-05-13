// Bloco para a troca de temas do site (dark mode)
document.addEventListener('DOMContentLoaded', () => {
    const btnTema = document.getElementById('btnTema');
    const htmlElement = document.documentElement;

    const updateIcon = (theme) => {
        if (theme === 'dark') {
            btnTema.innerHTML = `
                <span id="temaIcon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-sun-fill" viewBox="0 0 16 16">
                        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                    </svg>
                </span>`;
        } else {
            btnTema.innerHTML = `
                <span id="temaIcon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-moon-stars-fill" viewBox="0 0 16 16">
                        <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                        <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.386 6.53l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z"/>
                    </svg>
                </span>`;
        }
    };

    // Inicializa o ícone com base no tema atual (já definido no head do base.html)
    updateIcon(htmlElement.getAttribute('data-bs-theme'));

    btnTema.addEventListener('click', () => {
        const temaAtual = htmlElement.getAttribute('data-bs-theme');
        const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-bs-theme', novoTema);
        localStorage.setItem('theme', novoTema);
        updateIcon(novoTema);
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