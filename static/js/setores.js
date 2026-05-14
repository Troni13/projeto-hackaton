document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('#sectorTabs button');
    
    // Configurações de UI (Reutilizando as do painel.js se necessário, mas aqui são independentes)
    const prioridadeClasses = { alta: 'text-bg-danger', normal: 'text-bg-success' };
    const textoPrioridade = { alta: 'Alta', normal: 'Normal' };
    const textoCategoria = { CAE: 'CAE - Apoio/Ensino', CTI: 'CTI - Tecnologia', CAP: 'CAP - Estrutura/Limpeza' };
    const statusCores = { 'aberto': 'primary', 'em atendimento': 'warning', 'finalizado': 'success', 'cancelado': 'danger' };

    // Bloquear abas se não for ADM
    if (CURRENT_USER_ROLE !== 'adm') {
        tabs.forEach(tab => {
            const setorTab = tab.id.split('-')[0].toUpperCase();
            if (setorTab !== CURRENT_USER_SETOR) {
                tab.disabled = true;
                tab.classList.add('opacity-25');
                tab.title = "Você não tem permissão para acessar este setor.";
            } else {
                // Forçar a aba do usuário a ser a ativa se não for ADM
                const tabTrigger = new bootstrap.Tab(tab);
                tabTrigger.show();
            }
        });
    }

    const montarCardSetor = (chamado) => {
        const classePrioridade = prioridadeClasses[chamado.prioridade] || 'text-bg-secondary';
        const prioridade = textoPrioridade[chamado.prioridade] || chamado.prioridade;
        const categoria = textoCategoria[chamado.categoria] || chamado.categoria;
        const corStatus = statusCores[chamado.status] || 'secondary';

        return `
            <article class="col-md-6 col-xl-4">
                <div class="card h-100 shadow-sm border-1 bg-body hover-shadow transition" style="cursor:pointer;" onclick="abrirModalInteracao(${chamado.id}, '${chamado.categoria}', '${chamado.status}', '${chamado.autor}')">
                    <div class="card-header bg-body d-flex justify-content-between align-items-start gap-3 border-0 pt-3">
                        <div>
                            <span class="text-muted small fw-bold">#${escaparHtml(chamado.id)}</span>
                            <h3 class="h5 fw-bold mb-0 text-success">${escaparHtml(categoria)}</h3>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-1">
                            <span class="badge ${classePrioridade}">${escaparHtml(prioridade)}</span>
                            <span class="badge bg-${corStatus} text-uppercase" style="font-size:0.65rem;">${escaparHtml(chamado.status)}</span>
                        </div>
                    </div>
                    <div class="card-body pt-2">
                        <p class="card-text text-truncate" style="max-height: 4.5rem; white-space: pre-wrap;">${escaparHtml(chamado.descricao)}</p>
                        <hr class="text-muted opacity-25">
                        <div class="d-flex justify-content-between align-items-center small">
                            <span class="text-muted"><i class="bi bi-geo-alt"></i> ${escaparHtml(chamado.localizacao)}</span>
                            <span class="text-muted">${escaparHtml(chamado.data_abertura)}</span>
                        </div>
                        <div class="mt-3 d-grid">
                            <button class="btn btn-sm btn-outline-success fw-bold rounded-pill">Atender Chamado</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    };

    const atualizarIndicadores = (chamados) => {
        const concluidos = chamados.filter(c => c.status === 'finalizado');
        const emAberto = chamados.filter(c => c.status === 'aberto' || c.status === 'em atendimento');
        
        // Concluídos e Em Aberto
        document.getElementById('indicador-concluidos').textContent = concluidos.length;
        document.getElementById('indicador-aberto').textContent = emAberto.length;
    };

    const carregarChamadosSetor = async (setor) => {
        const container = document.getElementById(`lista-${setor}`);
        if (!container) return;

        container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-success" role="status"></div></div>`;

        try {
            const res = await fetch(`/api/chamados/setor?setor=${setor}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.erro);

            atualizarIndicadores(data);

            if (data.length === 0) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Nenhum chamado pendente para este setor.</p></div>`;
            } else {
                container.innerHTML = data.map(montarCardSetor).join('');
            }
        } catch (e) {
            container.innerHTML = `<div class="col-12"><div class="alert alert-danger">${escaparHtml(e.message)}</div></div>`;
        }
    };

    // Escuta troca de abas
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const setor = e.target.id.split('-')[0].toUpperCase();
            carregarChamadosSetor(setor);
        });
    });

    // Carga inicial
    const activeTab = document.querySelector('#sectorTabs .nav-link.active');
    if (activeTab) {
        carregarChamadosSetor(activeTab.id.split('-')[0].toUpperCase());
    }

    // Sobrescrever a função global de recarregar chamados para funcionar nesta página também
    window.carregarChamados = () => {
        const activeTab = document.querySelector('#sectorTabs .nav-link.active');
        if (activeTab) {
            carregarChamadosSetor(activeTab.id.split('-')[0].toUpperCase());
        }
    };
});
