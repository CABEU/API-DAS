/** Funções de apoio para montar as telas. */

export const STATUS = {
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em atendimento',
    AGUARDANDO_CLIENTE: 'Aguardando cliente',
    FECHADO: 'Fechado',
};

export const PRIORIDADE = {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
};

export const PERFIL = {
    ADMIN: 'Administrador',
    TECNICO: 'Técnico',
};

/** Escapa texto vindo da API antes de colocá-lo no HTML (evita XSS). */
export function esc(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function formatarData(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function badgeStatus(status) {
    return `<span class="badge status-${status.toLowerCase()}">${esc(STATUS[status] ?? status)}</span>`;
}

export function badgePrioridade(prioridade) {
    return `<span class="badge prioridade-${prioridade.toLowerCase()}">${esc(PRIORIDADE[prioridade] ?? prioridade)}</span>`;
}

/** Gera as <option> de um <select> a partir de um objeto { valor: rótulo }. */
export function opcoes(mapa, selecionado, vazio) {
    const primeira = vazio ? `<option value="">${esc(vazio)}</option>` : '';
    return primeira + Object.entries(mapa)
        .map(([valor, rotulo]) =>
            `<option value="${esc(valor)}" ${String(valor) === String(selecionado ?? '') ? 'selected' : ''}>${esc(rotulo)}</option>`)
        .join('');
}

/** Converte os campos de um <form> em objeto; campos vazios viram null. */
export function lerFormulario(form) {
    const dados = {};
    for (const [chave, valor] of new FormData(form).entries()) {
        const texto = String(valor).trim();
        dados[chave] = texto === '' ? null : texto;
    }
    return dados;
}

export function aviso(mensagem, tipo = 'sucesso') {
    const caixa = document.createElement('div');
    caixa.className = `aviso aviso-${tipo}`;
    caixa.textContent = mensagem;
    document.getElementById('avisos').append(caixa);
    setTimeout(() => caixa.remove(), 4000);
}

/**
 * Mostra um erro da API. Se houver um <div class="erros"> no formulário,
 * os detalhes de validação (HTTP 400) aparecem nele, campo a campo.
 */
export function mostrarErro(erro, form) {
    const alvo = form?.querySelector('.erros');
    if (alvo) {
        alvo.innerHTML = `<strong>${esc(erro.message)}</strong>`
            + (erro.detalhes?.length ? `<ul>${erro.detalhes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '');
        alvo.hidden = false;
    } else {
        aviso(erro.message, 'erro');
    }
}

export function limparErro(form) {
    const alvo = form?.querySelector('.erros');
    if (alvo) alvo.hidden = true;
}

/** Desabilita o botão de envio enquanto a requisição está em andamento. */
export async function enviando(form, acao) {
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    limparErro(form);
    try {
        await acao();
    } catch (erro) {
        mostrarErro(erro, form);
    } finally {
        botao.disabled = false;
    }
}

export function vazio(mensagem, acao = '') {
    return `<div class="vazio"><p>${esc(mensagem)}</p>${acao}</div>`;
}
