document.addEventListener('DOMContentLoaded', () => {
    // Apenas iniciar se o ícone do sino existir na tela (ou seja, se o usuário estiver logado)
    if(document.getElementById('badgeNotificacoes')) {
        buscarNotificacoes();
        // Polling: busca notificações a cada 30 segundos
        setInterval(buscarNotificacoes, 30000);
    }
});

async function buscarNotificacoes() {
    try {
        const res = await fetch('/api/notificacoes/');
        if(!res.ok) {
            console.error("Erro na resposta da API de notificações:", res.status);
            return;
        }
        const data = await res.json();
        console.log("Notificações recebidas:", data.notificacoes);
        atualizarUiNotificacoes(data.notificacoes);
    } catch(e) {
        console.error("Erro ao buscar notificações:", e);
    }
}

function atualizarUiNotificacoes(notificacoes) {
    const badge = document.getElementById('badgeNotificacoes');
    const lista = document.getElementById('listaNotificacoes');
    
    // Atualiza o número no badge
    if(notificacoes.length > 0) {
        badge.textContent = notificacoes.length > 9 ? '9+' : notificacoes.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
    
    // Monta a lista
    if(notificacoes.length === 0) {
        lista.innerHTML = `<li class="p-4 text-center text-muted small">Você não tem novas notificações.</li>`;
        return;
    }
    
    let html = '';
    notificacoes.forEach(n => {
        // Redireciona para o link (se houver) e depois marca como lida
        let onClickAction = n.link ? `onclick="clicarNotificacao(${n.id}, '${n.link}')"` : `onclick="marcarComoLida(${n.id})"`;
        
        html += `
            <li class="p-3 border-bottom position-relative hover-bg-light transition" style="cursor: pointer;" ${onClickAction}>
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <strong class="text-dark small">${n.titulo}</strong>
                    <span class="text-muted" style="font-size: 0.65rem;">${n.data_criacao}</span>
                </div>
                <div class="text-muted" style="font-size: 0.8rem; line-height: 1.3;">
                    ${n.mensagem}
                </div>
            </li>
        `;
    });
    
    lista.innerHTML = html;
}

window.clicarNotificacao = async (id, link) => {
    // Marca como lida em background
    try {
        await fetch(`/api/notificacoes/${id}/lida/`, { method: 'PUT' });
    } catch(e) { console.error(e); }
    
    // Redireciona
    window.location.href = link;
};

window.marcarComoLida = async (id) => {
    try {
        const res = await fetch(`/api/notificacoes/${id}/lida/`, { method: 'PUT' });
        if(res.ok) {
            buscarNotificacoes();
        }
    } catch(e) { console.error(e); }
};

window.marcarTodasComoLidas = async () => {
    try {
        const res = await fetch(`/api/notificacoes/ler_todas/`, { method: 'PUT' });
        if(res.ok) {
            buscarNotificacoes();
        }
    } catch(e) { console.error(e); }
};
