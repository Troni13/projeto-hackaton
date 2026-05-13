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
        totalChamados.textContent = quantidade === 1 ? '1 chamado' : `${quantidade} chamados`;
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
                            <button class="btn btn-sm btn-outline-success fw-bold rounded-pill">Ver Detalhes</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    };

    window.carregarChamados = async () => {
        listaChamados.innerHTML = `<div class="col-12"><div class="alert alert-info mb-0">Carregando chamados...</div></div>`;
        try {
            const resposta = await fetch('/api/chamados');
            todosChamados = await resposta.json();
            if (!resposta.ok) throw new Error(todosChamados.erro || 'Erro ao carregar chamados');
            
            aplicarFiltros();
        } catch (erro) {
            atualizarTotal(0);
            listaChamados.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0">${escaparHtml(erro.message)}</div></div>`;
        }
    };

    const aplicarFiltros = () => {
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
                // c.data_abertura format: "dd/mm/yyyy hh:mm"
                // data_inicio format: "yyyy-mm-dd"
                const partes = data_inicio.split('-');
                if (partes.length === 3) {
                    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                    matchData = c.data_abertura.startsWith(dataFormatada);
                }
            }

            if (prioridade) {
                matchPrioridade = c.prioridade === prioridade;
            }

            if (setor) {
                matchSetor = c.categoria === setor;
            }

            return matchPesquisa && matchData && matchPrioridade && matchSetor;
        });

        atualizarTotal(chamadosFiltrados.length);
        if (!chamadosFiltrados.length) {
            listaChamados.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">Nenhum chamado encontrado.</div></div>`;
            return;
        }
        listaChamados.innerHTML = chamadosFiltrados.map(montarCard).join('');
    };

    formFiltros.addEventListener('submit', (e) => { e.preventDefault(); aplicarFiltros(); });
    btnLimparFiltros.addEventListener('click', () => { formFiltros.reset(); aplicarFiltros(); });

    carregarChamados();
});

// Variaveis globais para o modal
let chamadoAtualId = null;
let chamadoAtualCategoria = null;
let chamadoAtualStatus = null;
let chamadoAtualAutor = null;

window.escaparHtml = (valor) => {
    const div = document.createElement('div');
    div.textContent = valor || '';
    return div.innerHTML;
};

// Funções do Modal
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

    try {
        const res = await fetch(`/api/chamados/${id}/interacoes`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.erro);
        
        // Atualiza status localmente
        chamadoAtualStatus = data.status_atual;

        // Renderizar Chat
        if(data.interacoes.length === 0) {
            chatContainer.innerHTML = `<div class="text-center text-muted mt-3">Nenhuma interação ainda.</div>`;
        } else {
            let htmlConteudo = "";
            data.interacoes.forEach(msg => {
                let align = msg.eh_sistema ? 'mx-auto' : (msg.autor_role === 'aluno' ? 'me-auto' : 'ms-auto');
                let bg = msg.eh_sistema ? 'bg-warning text-dark bg-opacity-25' : (msg.autor_role === 'aluno' ? 'bg-white border' : 'bg-success text-white');
                if (msg.eh_sistema && msg.mensagem.includes('CANCELADO')) bg = 'bg-danger text-white';
                
                htmlConteudo += `
                    <div class="p-3 rounded-4 shadow-sm ${bg} ${align}" style="max-width: 85%;">
                        <div class="d-flex justify-content-between mb-1" style="font-size: 0.75rem; opacity: 0.8;">
                            <strong>${msg.eh_sistema ? '🤖 Sistema' : window.escaparHtml(msg.autor)}</strong>
                            <span class="ms-3">${msg.data_hora}</span>
                        </div>
                        <div style="white-space: pre-wrap; font-size: 0.9rem;">${window.escaparHtml(msg.mensagem)}</div>
                    </div>
                `;
            });
            chatContainer.innerHTML = htmlConteudo;
        }
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        const isAberto = data.status_atual !== 'finalizado' && data.status_atual !== 'cancelado';
        
        // Definir se o usuário tem permissão para o Setor deste chamado
        const isGestorSetor = (CURRENT_USER_ROLE === 'gestor' || CURRENT_USER_ROLE === 'professor') && (!CURRENT_USER_SETOR || CURRENT_USER_SETOR === categoria);
        const isAutor = autorNome && (CURRENT_USER_ROLE === 'aluno'); 
        const isAdm = CURRENT_USER_ROLE === 'adm';

        // Pode comentar?
        if (isAberto && (isGestorSetor || isAutor || isAdm || (!CURRENT_USER_SETOR && CURRENT_USER_ROLE !== 'aluno'))) {
            areaComentario.style.display = 'block';
        }

        // Renderizar Botões
        let botoesHtml = ``;
        
        if (isAberto && (isGestorSetor || isAdm)) {
            if (data.status_atual === 'aberto') {
                botoesHtml += `<button class="btn btn-warning fw-bold rounded-pill" onclick="mudarStatus('em atendimento')">Iniciar Atendimento</button>`;
            } else if (data.status_atual === 'em atendimento') {
                botoesHtml += `<button class="btn btn-success fw-bold rounded-pill" onclick="pedirResolucaoEFinalizar()">Finalizar Chamado</button>`;
            }
            
            botoesHtml += `
                <div class="input-group" style="width: 250px;">
                    <select class="form-select form-select-sm" id="selectTransferir">
                        <option value="">Transferir para...</option>
                        <option value="CAE">CAE</option>
                        <option value="CAP">CAP</option>
                        <option value="CTI">CTI</option>
                    </select>
                    <button class="btn btn-outline-secondary" type="button" onclick="transferir()">Ir</button>
                </div>
            `;
        }

        if (isAberto && (isGestorSetor || isAdm || isAutor)) {
            botoesHtml += `<button class="btn btn-danger fw-bold rounded-pill ms-auto" onclick="pedirJustificativaECancelar()">Cancelar</button>`;
        }

        modalFooter.innerHTML = botoesHtml;

    } catch(e) {
        chatContainer.innerHTML = `<div class="alert alert-danger">Erro de renderização: ${window.escaparHtml(e.message)}</div>`;
    }
};

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
            abrirModalInteracao(chamadoAtualId, chamadoAtualCategoria, chamadoAtualStatus, chamadoAtualAutor);
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
            carregarChamados();
            abrirModalInteracao(chamadoAtualId, chamadoAtualCategoria, novoStatus, chamadoAtualAutor);
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao alterar status."); }
};

window.pedirResolucaoEFinalizar = () => {
    const resolucao = prompt("Descreva a resolução do problema (Obrigatório para finalizar):");
    if(resolucao) {
        mudarStatus('finalizado', resolucao);
    }
};

window.pedirJustificativaECancelar = async () => {
    const justificativa = prompt("Qual a justificativa para o cancelamento? (Obrigatório):");
    if(!justificativa) return;
    
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/cancelar`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({justificativa})
        });
        if(res.ok) {
            carregarChamados();
            abrirModalInteracao(chamadoAtualId, chamadoAtualCategoria, 'cancelado', chamadoAtualAutor);
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao cancelar."); }
};

window.transferir = async () => {
    const setor = document.getElementById('selectTransferir').value;
    if(!setor) return alert("Selecione um setor.");
    if(!confirm(`Deseja mesmo transferir para ${setor}?`)) return;
    
    try {
        const res = await fetch(`/api/chamados/${chamadoAtualId}/transferir`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({setor})
        });
        if(res.ok) {
            carregarChamados();
            bootstrap.Modal.getInstance(document.getElementById('modalInteracao')).hide();
        } else {
            const data = await res.json();
            alert(data.erro);
        }
    } catch(e) { alert("Erro de rede ao transferir."); }
};
