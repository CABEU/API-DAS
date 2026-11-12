/**
 * Camada de acesso à API REST.
 * As telas nunca chamam fetch diretamente: passam sempre por aqui,
 * assim como os Controllers do back-end passam sempre pelo Service.
 */

/** Erro devolvido pela API no formato ErroResposta { momento, status, erro, detalhes }. */
export class ErroApi extends Error {
    constructor(status, corpo) {
        super(corpo?.erro ?? `Erro HTTP ${status}`);
        this.status = status;
        this.detalhes = corpo?.detalhes ?? [];
    }
}

async function requisitar(metodo, rota, corpo) {
    const opcoes = { method: metodo, headers: { Accept: 'application/json' } };
    if (corpo !== undefined) {
        opcoes.headers['Content-Type'] = 'application/json';
        opcoes.body = JSON.stringify(corpo);
    }

    let resposta;
    try {
        resposta = await fetch(rota, opcoes);
    } catch {
        throw new ErroApi(0, { erro: 'Não foi possível falar com a API. Ela está rodando?' });
    }

    if (resposta.status === 204) {
        return null;
    }

    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new ErroApi(resposta.status, dados);
    }
    return dados;
}

export const api = {
    get: (rota) => requisitar('GET', rota),
    post: (rota, corpo) => requisitar('POST', rota, corpo),
    put: (rota, corpo) => requisitar('PUT', rota, corpo),
    patch: (rota, corpo) => requisitar('PATCH', rota, corpo),
    excluir: (rota) => requisitar('DELETE', rota),
};
