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
        CAE: 'CAE - Apoio/Ensino',
        CTI: 'CTI - Tecnologia',
        CAP: 'CAP - Estrutura/Limpeza'
    };

    const statusCores = {
        'aberto': 'primary',
        'em atendimento': 'warning',
        'finalizado': 'success',
        'cancelado': 'danger'
    };

    let todosChamados = [];

    const atualizarTotal = (quantidade) => {
        if (totalChamados) totalChamados.textContent = quantidade === 1 ? '1 chamado' : `${quantidade} chamados`;
    };

    const montarCard = (chamado) => {
        const classePrioridade = prioridadeClasses[chamado.prioridade] || 'text-bg-secondary';
        const prioridade = textoPrioridade[chamado.prioridade] || chamado.prioridade;
        const categoria = textoCategoria[chamado.categoria] || chamado.categoria;
        const corStatus = statusCores[chamado.status] || 'secondary';

        return `
            <article class="col-md-6 col-xl-4">
                <div class="card h-100 shadow-sm border-1 bg-body hover-shadow transition" style="cursor:pointer;" onclick="abrirModalInteracao(${chamado.id}, '${chamado.categoria}', '${chamado.status}', '${chamado.autor}')">
                    <div class="card-header bg-body d-flex justify-content-between align-items-start gap-3 border-0 pt-3">
                        <div>
                            <span class="text-muted small fw-bold">#${window.escaparHtml(chamado.id)}</span>
                            <h3 class="h5 fw-bold mb-0 text-success">${window.escaparHtml(categoria)}</h3>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-1">
                            <span class="badge ${classePrioridade}">${window.escaparHtml(prioridade)}</span>
                            <span class="badge bg-${corStatus} text-uppercase" style="font-size:0.65rem;">${window.escaparHtml(chamado.status)}</span>
                        </div>
                    </div>
                    <div class="card-body pt-2">
                        <p class="card-text text-truncate" style="max-height: 4.5rem; white-space: pre-wrap;">${window.escaparHtml(chamado.descricao)}</p>
                        <hr class="text-muted opacity-25">
                        <div class="d-flex justify-content-between align-items-center small">
                            <span class="text-muted"><i class="bi bi-geo-alt"></i> ${window.escaparHtml(chamado.localizacao)}</span>
                            <span class="text-muted">${window.escaparHtml(chamado.data_abertura)}</span>
                        </div>
                        <div class="mt-3 d-grid">
                            <button class="btn btn-sm btn-outline-success fw-bold rounded-pill">Ver Detalhes</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    };

    window.carregarChamados = async () => {
        if (!listaChamados) return;
        listaChamados.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-success" role="status"></div></div>`;
        try {
            const resposta = await fetch('/api/chamados');
            const data = await resposta.json();
            if (!resposta.ok) throw new Error(data.erro || 'Erro ao carregar chamados');
            todosChamados = data;
            aplicarFiltros();
        } catch (erro) {
            atualizarTotal(0);
            listaChamados.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${window.escaparHtml(erro.message)}</div></div>`;
        }
    };

    const aplicarFiltros = () => {
        if (!formFiltros) return;
        const dados = new FormData(formFiltros);
        const pesquisa = (dados.get('pesquisa') || '').toLowerCase();
        const data_inicio = dados.get('data_inicio') || '';
        const prioridade = dados.get('prioridade') || '';
        const setor = dados.get('setor') || '';

        const chamadosFiltrados = todosChamados.filter(c => {
            let matchPesquisa = true;
            let matchData = true;
            let matchPrioridade = true;
            let matchSetor = true;

            if (pesquisa) {
                const textoPesquisa = `${c.localizacao} ${c.categoria} ${c.descricao} ${c.status} ${c.id} ${c.autor}`.toLowerCase();
                matchPesquisa = textoPesquisa.includes(pesquisa);
            }

            if (data_inicio) {
                const partes = data_inicio.split('-');
                if (partes.length === 3) {
                    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                    matchData = c.data_abertura.startsWith(dataFormatada);
                }
            }

            if (prioridade) matchPrioridade = c.prioridade === prioridade;
            if (setor) matchSetor = c.categoria === setor;

            return matchPesquisa && matchData && matchPrioridade && matchSetor;
        });

        atualizarTotal(chamadosFiltrados.length);
        if (!chamadosFiltrados.length) {
            listaChamados.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Nenhum chamado encontrado.</p></div>`;
            return;
        }
        listaChamados.innerHTML = chamadosFiltrados.map(montarCard).join('');
    };

    if (formFiltros && listaChamados) {
        formFiltros.addEventListener('submit', (e) => { e.preventDefault(); aplicarFiltros(); });
        btnLimparFiltros.addEventListener('click', () => { formFiltros.reset(); aplicarFiltros(); });
        carregarChamados();
    }
});

// Variáveis globais para o modal
let chamadoAtualId = null;
let chamadoAtualCategoria = null;
let chamadoAtualStatus = null;
let chamadoAtualAutor = null;
let chatPollingInterval = null;

window.escaparHtml = (valor) => {
    const div = document.createElement('div');
    div.textContent = valor || '';
    return div.innerHTML;
};

// Funções do Modal de Interação
window.abrirModalInteracao = async (id, categoria, status, autorNome) => {
    chamadoAtualId = id;
    chamadoAtualCategoria = categoria;
    chamadoAtualStatus = status;
    chamadoAtualAutor = autorNome;
    
    const modalTitle = document.getElementById('modalInteracaoTitle');
    const chatContainer = document.getElementById('chatContainer');
    const areaComentario = document.getElementById('areaComentario');
    const modalFooter = document.getElementById('modalFooterAcoes');
    
    modalTitle.textContent = `Chamado #${id} - ${categoria}`;
    chatContainer.innerHTML = `<div class="text-center text-muted mt-5 spinner-border mx-auto" role="status"></div>`;
    areaComentario.style.display = 'none';
    modalFooter.innerHTML = '';

    const modalEl = document.getElementById('modalInteracao');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    if (!modalEl.classList.contains('show')) {
        modal.show();
    }

    // Iniciar Polling de mensagens
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(() => window.atualizarMensagensChat(id, categoria, autorNome), 3000);

    // Carregamento inicial de mensagens e BOTÕES
    await window.atualizarMensagensChat(id, categoria, autorNome);
    window.renderizarBotoesModal(chamadoAtualStatus, categoria, autorNome);
};

// Função que atualiza as mensagens (chamada periodicamente)
window.atualizarMensagensChat = async (id, categoria, autorNome) => {
    const chatContainer = document.getElementById('chatContainer');
    const areaComentario = document.getElementById('areaComentario');
    const modalFooter = document.getElementById('modalFooterAcoes');
    
    try {
        const res = await fetch(`/api/chamados/${id}/interacoes`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);

        // Se o status mudou externamente, re-renderiza o modal para atualizar botões
        if (chamadoAtualStatus !== data.status_atual) {
            chamadoAtualStatus = data.status_atual;
            window.renderizarBotoesModal(data.status_atual, categoria, autorNome);
        }

        // Renderizar Chat
        let htmlConteudo = "";
        if (data.interacoes.length === 0) {
            htmlConteudo = `<div class="text-center text-muted mt-3">Nenhuma interação ainda.</div>`;
        } else {
            data.interacoes.forEach(msg => {
                let align = msg.eh_sistema ? 'mx-auto' : (msg.autor_role === 'aluno' ? 'me-auto' : 'ms-auto');
                let bg = msg.eh_sistema ? 'bg-warning text-dark bg-opacity-25' : (msg.autor_role === 'aluno' ? 'bg-white border' : 'bg-success text-white');
                if (msg.eh_sistema && msg.mensagem.includes('CANCELADO')) bg = 'bg-danger text-white';
                
                htmlConteudo += `
                    <div class="p-3 rounded-4 shadow-sm ${bg} ${align} mb-3" style="max-width: 85%;">
                        <div class="d-flex justify-content-between mb-1" style="font-size: 0.75rem; opacity: 0.8;">
                            <strong>${msg.eh_sistema ? 'Sistema' : window.escaparHtml(msg.autor)}</strong>
                            <span class="ms-3">${msg.data_hora}</span>
                        </div>
                        <div style="white-space: pre-wrap; font-size: 0.9rem;">${window.escaparHtml(msg.mensagem)}</div>
                    </div>
                `;
            });
        }

        // Só atualiza o DOM se o conteúdo for diferente (evita flicker)
        if (chatContainer.innerHTML !== htmlConteudo) {
            const wasAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 100;
            chatContainer.innerHTML = htmlConteudo;
            if (wasAtBottom) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        // Atualizar visibilidade da área de comentário
        const isAberto = data.status_atual !== 'finalizado' && data.status_atual !== 'cancelado';
        const isGestorSetor = (CURRENT_USER_ROLE === 'gestor' || CURRENT_USER_ROLE === 'professor') && (CURRENT_USER_SETOR === categoria);
        const isAdm = CURRENT_USER_ROLE === 'adm';
        // Se for aluno, só comenta se for o autor. Se for gestor/adm, comenta em qualquer um aberto.
        const podeComentar = isAberto && (isAdm || isGestorSetor || CURRENT_USER_ROLE === 'aluno');

        areaComentario.style.display = podeComentar ? 'block' : 'none';

    } catch (e) {
        console.error("Erro no polling:", e);
    }
};

window.renderizarBotoesModal = (status, categoria, autorNome) => {
    const modalFooter = document.getElementById('modalFooterAcoes');
    const isAberto = status !== 'finalizado' && status !== 'cancelado';
    
    // Verifica se o usuário é gestor/professor e se pertence ao setor do chamado (ou se é ADM)
    const isAdm = CURRENT_USER_ROLE === 'adm';
    const isGestorSetor = (CURRENT_USER_ROLE === 'gestor' || CURRENT_USER_ROLE === 'professor') && (CURRENT_USER_SETOR === categoria);
    const isAutor = (CURRENT_USER_ROLE === 'aluno'); 

    let botoesHtml = ``;
    
    if (isAberto && (isGestorSetor || isAdm)) {
        if (status === 'aberto') {
            botoesHtml += `<button class="btn btn-warning fw-bold rounded-pill" onclick="mudarStatus('em atendimento')">Iniciar Atendimento</button>`;
        } else if (status === 'em atendimento') {
            botoesHtml += `<button class="btn btn-success fw-bold rounded-pill" onclick="mostrarFormFinalizar()">Finalizar Chamado</button>`;
        }
        
        botoesHtml += `
            <div class="input-group" style="width: 200px;">
                <select class="form-select form-select-sm" id="selectTransferir">
                    <option value="">Transferir...</option>
                    <option value="CAE">CAE</option>
                    <option value="CAP">CAP</option>
                    <option value="CTI">CTI</option>
                </select>
                <button class="btn btn-sm btn-outline-secondary" type="button" onclick="transferir()">Ir</button>
            </div>
        `;
    }

    if (isAberto && (isGestorSetor || isAdm || isAutor)) {
        botoesHtml += `<button class="btn btn-danger fw-bold rounded-pill ms-auto" onclick="mostrarFormCancelar()">Cancelar</button>`;
    }

    modalFooter.innerHTML = botoesHtml;
};

// Limpar polling ao fechar o modal
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('modalInteracao');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (chatPollingInterval) {
                clearInterval(chatPollingInterval);
                chatPollingInterval = null;
            }
        });
    }
});

window.enviarComentario = async () => {
    const txt = document.getElementById('txtComentario');
    const msg = txt.value.trim();
    if(!msg) return;
    
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/interagir`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({mensagem: msg})
        });
        if(res.ok) {
            txt.value = '';
            await window.atualizarMensagensChat(chamadoAtualId, chamadoAtualCategoria, chamadoAtualAutor);
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao enviar comentário."); }
};

window.mudarStatus = async (novoStatus, resolucao="") => {
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: novoStatus, resolucao})
        });
        if(res.ok) {
            if (window.carregarChamados) window.carregarChamados();
            await window.atualizarMensagensChat(chamadoAtualId, chamadoAtualCategoria, chamadoAtualAutor);
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao alterar status."); }
};

window.mostrarFormFinalizar = () => {
    const modalFooter = document.getElementById('modalFooterAcoes');
    modalFooter.innerHTML = `
        <div class="w-100">
            <label class="form-label text-success fw-bold mb-1 small">Resolução do problema (Obrigatório):</label>
            <textarea id="txtResolucao" class="form-control mb-3 rounded-3 shadow-sm" rows="2"></textarea>
            <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="voltarBotoesAcao()">Voltar</button>
                <button class="btn btn-sm btn-success rounded-pill" onclick="confirmarFinalizar()">Confirmar</button>
            </div>
        </div>
    `;
    document.getElementById('txtResolucao').focus();
};

window.mostrarFormCancelar = () => {
    const modalFooter = document.getElementById('modalFooterAcoes');
    modalFooter.innerHTML = `
        <div class="w-100">
            <label class="form-label text-danger fw-bold mb-1 small">Justificativa do cancelamento:</label>
            <textarea id="txtJustificativa" class="form-control mb-3 rounded-3 shadow-sm" rows="2"></textarea>
            <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="voltarBotoesAcao()">Voltar</button>
                <button class="btn btn-sm btn-danger rounded-pill" onclick="confirmarCancelar()">Cancelar Chamado</button>
            </div>
        </div>
    `;
    document.getElementById('txtJustificativa').focus();
};

window.voltarBotoesAcao = () => {
    window.renderizarBotoesModal(chamadoAtualStatus, chamadoAtualCategoria, chamadoAtualAutor);
};

window.confirmarFinalizar = () => {
    const txt = document.getElementById('txtResolucao');
    const resolucao = txt.value.trim();
    if(!resolucao) return alert("Preencha a resolução.");
    window.mudarStatus('finalizado', resolucao);
};

window.confirmarCancelar = async () => {
    const txt = document.getElementById('txtJustificativa');
    const justificativa = txt.value.trim();
    if(!justificativa) return alert("Preencha a justificativa.");
    
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/cancelar`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({justificativa})
        });
        if(res.ok) {
            if (window.carregarChamados) window.carregarChamados();
            await window.atualizarMensagensChat(chamadoAtualId, chamadoAtualCategoria, chamadoAtualAutor);
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao cancelar."); }
};

window.transferir = async () => {
    const setor = document.getElementById('selectTransferir').value;
    if(!setor) return alert("Selecione um setor.");
    if(!confirm(`Deseja transferir para ${setor}?`)) return;
    
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/transferir`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({setor})
        });
        if(res.ok) {
            if (window.carregarChamados) window.carregarChamados();
            bootstrap.Modal.getInstance(document.getElementById('modalInteracao')).hide();
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao transferir."); }
};
