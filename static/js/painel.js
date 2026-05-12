document.addEventListener('DOMContentLoaded', () => {
    const formFiltros = document.getElementById('formFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const listaChamados = document.getElementById('listaChamados');
    const totalChamados = document.getElementById('totalChamados');

    const prioridadeClasses = {
        alta: 'text-bg-danger',
        normal: 'text-bg-success'
    };

    const textoPrioridade = {
        alta: 'Alta',
        normal: 'Normal'
    };

    const textoCategoria = {
        estrutural: 'Estrutural',
        tecnologica: 'Tecnologico',
        limpeza: 'Limpeza'
    };

    const escaparHtml = (valor) => {
        const div = document.createElement('div');
        div.textContent = valor || '';
        return div.innerHTML;
    };

    const montarUrl = () => {
        const dados = new FormData(formFiltros);
        const parametros = new URLSearchParams();

        for (const [campo, valor] of dados.entries()) {
            if (valor) parametros.append(campo, valor);
        }

        const query = parametros.toString();
        return query ? `/api/chamados?${query}` : '/api/chamados';
    };

    const atualizarTotal = (quantidade) => {
        totalChamados.textContent = quantidade === 1 ? '1 chamado' : `${quantidade} chamados`;
    };

    const montarCard = (chamado) => {
        const classePrioridade = prioridadeClasses[chamado.prioridade] || 'text-bg-secondary';
        const prioridade = textoPrioridade[chamado.prioridade] || chamado.prioridade;
        const categoria = textoCategoria[chamado.categoria] || chamado.categoria;

        return `
            <article class="col-md-6 col-xl-4">
                <div class="card h-100 shadow-sm border-1 bg-body">
                    <div class="card-header bg-body d-flex justify-content-between align-items-start gap-3">
                        <div>
                            <span class="text-muted small">Chamado #${escaparHtml(chamado.id)}</span>
                            <h3 class="h5 fw-bold mb-0">${escaparHtml(categoria)}</h3>
                        </div>
                        <span class="badge ${classePrioridade}">${escaparHtml(prioridade)}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${escaparHtml(chamado.descricao)}</p>
                        <dl class="row mb-0 small">
                            <dt class="col-5 text-muted">Localizacao</dt>
                            <dd class="col-7 fw-semibold">${escaparHtml(chamado.localizacao)}</dd>

                            <dt class="col-5 text-muted">Status</dt>
                            <dd class="col-7 fw-semibold text-capitalize">${escaparHtml(chamado.status)}</dd>

                            <dt class="col-5 text-muted">Abertura</dt>
                            <dd class="col-7 fw-semibold">${escaparHtml(chamado.data_abertura)}</dd>
                        </dl>
                    </div>
                </div>
            </article>
        `;
    };

    const carregarChamados = async () => {
        listaChamados.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info mb-0">Carregando chamados...</div>
            </div>
        `;

        try {
            const resposta = await fetch(montarUrl());
            const chamados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(chamados.erro || 'Erro ao carregar chamados');
            }

            atualizarTotal(chamados.length);

            if (!chamados.length) {
                listaChamados.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-warning mb-0">Nenhum chamado encontrado com os filtros selecionados.</div>
                    </div>
                `;
                return;
            }

            listaChamados.innerHTML = chamados.map(montarCard).join('');
        } catch (erro) {
            atualizarTotal(0);
            listaChamados.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger mb-0">${escaparHtml(erro.message)}</div>
                </div>
            `;
        }
    };

    formFiltros.addEventListener('submit', (event) => {
        event.preventDefault();
        carregarChamados();
    });

    btnLimparFiltros.addEventListener('click', () => {
        formFiltros.reset();
        carregarChamados();
    });

    carregarChamados();
});
