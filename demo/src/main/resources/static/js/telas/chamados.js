/** Telas de Chamados: Lista / Filtros / Novo / Editar e Detalhe (Status / Técnico / Comentários). */
import { api } from '../api.js';
import {
    PRIORIDADE, STATUS, aviso, badgePrioridade, badgeStatus, enviando, esc,
    formatarData, lerFormulario, mostrarErro, opcoes, vazio,
} from '../ui.js';

const ORDENACAO = {
    'dataAbertura,desc': 'Mais recentes',
    'dataAbertura,asc': 'Mais antigos',
    'titulo,asc': 'Título (A–Z)',
};

const TAMANHO_PAGINA = 10;

export async function lista(conteudo, { query }) {
    const filtros = {
        status: query.get('status') ?? '',
        prioridade: query.get('prioridade') ?? '',
        clienteId: query.get('clienteId') ?? '',
        sort: query.get('sort') ?? 'dataAbertura,desc',
        page: Number(query.get('page') ?? 0),
    };

    const parametros = new URLSearchParams({ size: TAMANHO_PAGINA, page: filtros.page, sort: filtros.sort });
    for (const campo of ['status', 'prioridade', 'clienteId']) {
        if (filtros[campo]) parametros.set(campo, filtros[campo]);
    }

    const [pagina, clientes] = await Promise.all([
        api.get(`/chamados?${parametros}`),
        api.get('/clientes'),
    ]);
    const mapaClientes = Object.fromEntries(clientes.map((c) => [c.id, c.nome]));
    const filtrando = filtros.status || filtros.prioridade || filtros.clienteId;

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <h1>Chamados</h1>
            <a class="botao primario" href="#/chamados/novo">Abrir chamado</a>
        </div>
        <form class="cartao filtros">
            <label>Status <select name="status">${opcoes(STATUS, filtros.status, 'Todos')}</select></label>
            <label>Prioridade <select name="prioridade">${opcoes(PRIORIDADE, filtros.prioridade, 'Todas')}</select></label>
            <label>Cliente <select name="clienteId">${opcoes(mapaClientes, filtros.clienteId, 'Todos')}</select></label>
            <label>Ordenar por <select name="sort">${opcoes(ORDENACAO, filtros.sort)}</select></label>
            <div class="botoes">
                <button type="submit" class="botao primario">Filtrar</button>
                ${filtrando ? '<a class="botao" href="#/chamados">Limpar</a>' : ''}
            </div>
        </form>
        <section class="cartao">
            ${pagina.conteudo.length === 0
                ? vazio(filtrando ? 'Nenhum chamado com esses filtros.' : 'Nenhum chamado aberto ainda.')
                : `<div class="tabela-rolagem"><table>
                    <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Status</th><th>Prioridade</th><th>Técnico</th><th>Abertura</th></tr></thead>
                    <tbody>${pagina.conteudo.map((c) => `
                        <tr>
                            <td>${c.id}</td>
                            <td><a href="#/chamados/${c.id}">${esc(c.titulo)}</a></td>
                            <td>${esc(c.clienteNome)}</td>
                            <td>${badgeStatus(c.status)}</td>
                            <td>${badgePrioridade(c.prioridade)}</td>
                            <td>${esc(c.tecnicoNome ?? '—')}</td>
                            <td>${formatarData(c.dataAbertura)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>
                <nav class="paginacao" aria-label="Paginação">
                    <button class="botao pequeno" data-pagina="${pagina.pagina - 1}" ${pagina.pagina === 0 ? 'disabled' : ''}>← Anterior</button>
                    <span>Página ${pagina.pagina + 1} de ${Math.max(pagina.totalPaginas, 1)} · ${pagina.totalElementos} chamado(s)</span>
                    <button class="botao pequeno" data-pagina="${pagina.pagina + 1}" ${pagina.pagina + 1 >= pagina.totalPaginas ? 'disabled' : ''}>Próxima →</button>
                </nav>`}
        </section>`;

    const irPara = (novosFiltros) => {
        const busca = new URLSearchParams();
        for (const [chave, valor] of Object.entries(novosFiltros)) {
            if (valor !== '' && valor !== null && !(chave === 'page' && valor === 0)) busca.set(chave, valor);
        }
        location.hash = `#/chamados${busca.size ? `?${busca}` : ''}`;
    };

    conteudo.querySelector('.filtros').addEventListener('submit', (evento) => {
        evento.preventDefault();
        const dados = Object.fromEntries(new FormData(evento.target).entries());
        irPara({ ...dados, page: 0 });
    });

    conteudo.querySelectorAll('[data-pagina]').forEach((botao) => {
        botao.addEventListener('click', () => irPara({ ...filtros, page: Number(botao.dataset.pagina) }));
    });
}

export async function formulario(conteudo, { id, query }) {
    const [clientes, categorias, existente] = await Promise.all([
        api.get('/clientes'),
        api.get('/categorias'),
        id ? api.get(`/chamados/${id}`).then((d) => d.chamado) : null,
    ]);

    if (existente?.status === 'FECHADO') {
        conteudo.innerHTML = `<section class="cartao"><h1>Chamado #${id} está fechado</h1>
            <p>Chamados fechados não podem ser editados.</p>
            <p><a class="botao" href="#/chamados/${id}">Voltar ao chamado</a></p></section>`;
        return;
    }

    if (clientes.length === 0 || categorias.length === 0) {
        conteudo.innerHTML = `<section class="cartao"><h1>Abrir chamado</h1>
            ${vazio('Para abrir um chamado é preciso ter pelo menos um cliente e uma categoria cadastrados.',
                `<p class="botoes">
                    ${clientes.length === 0 ? '<a class="botao primario" href="#/clientes/novo">Cadastrar cliente</a>' : ''}
                    ${categorias.length === 0 ? '<a class="botao primario" href="#/categorias">Cadastrar categoria</a>' : ''}
                </p>`)}
        </section>`;
        return;
    }

    const valores = existente ?? {
        titulo: '', descricao: '', prioridade: 'MEDIA',
        clienteId: query.get('clienteId') ?? '', categoriaId: '',
    };
    const nomes = (lista) => Object.fromEntries(lista.map((item) => [item.id, item.nome]));

    conteudo.innerHTML = `
        <div class="titulo-pagina"><h1>${id ? `Editar chamado #${id}` : 'Abrir chamado'}</h1></div>
        <form class="cartao formulario" novalidate>
            <div class="erros" hidden></div>
            <label>Título
                <input name="titulo" maxlength="120" required value="${esc(valores.titulo)}">
            </label>
            <label>Descrição
                <textarea name="descricao" maxlength="1000" rows="5" required>${esc(valores.descricao)}</textarea>
            </label>
            <div class="linha">
                <label>Cliente
                    <select name="clienteId" required>${opcoes(nomes(clientes), valores.clienteId, 'Selecione…')}</select>
                </label>
                <label>Categoria
                    <select name="categoriaId" required>${opcoes(nomes(categorias), valores.categoriaId, 'Selecione…')}</select>
                </label>
                <label>Prioridade
                    <select name="prioridade" required>${opcoes(PRIORIDADE, valores.prioridade)}</select>
                </label>
            </div>
            <div class="botoes">
                <button type="submit" class="botao primario">${id ? 'Salvar alterações' : 'Abrir chamado'}</button>
                <a class="botao" href="${id ? `#/chamados/${id}` : '#/chamados'}">Cancelar</a>
            </div>
        </form>`;

    const form = conteudo.querySelector('form');
    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        enviando(form, async () => {
            const dados = lerFormulario(form);
            const corpo = {
                ...dados,
                clienteId: dados.clienteId && Number(dados.clienteId),
                categoriaId: dados.categoriaId && Number(dados.categoriaId),
            };
            const salvo = id ? await api.put(`/chamados/${id}`, corpo) : await api.post('/chamados', corpo);
            aviso(id ? 'Chamado atualizado.' : `Chamado #${salvo.id} aberto.`);
            location.hash = `#/chamados/${salvo.id}`;
        });
    });
}

export async function detalhe(conteudo, { id }) {
    const [{ chamado: c, comentarios }, tecnicos] = await Promise.all([
        api.get(`/chamados/${id}`),
        api.get('/tecnicos'),
    ]);
    const fechado = c.status === 'FECHADO';
    const outrosStatus = Object.fromEntries(Object.entries(STATUS).filter(([valor]) => valor !== c.status));
    const nomesTecnicos = Object.fromEntries(tecnicos.map((t) => [t.id, t.nome]));

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <div>
                <p class="sobretitulo">Chamado #${c.id}</p>
                <h1>${esc(c.titulo)}</h1>
                <p class="etiquetas">${badgeStatus(c.status)} ${badgePrioridade(c.prioridade)}</p>
            </div>
            <div class="botoes">
                ${fechado ? '' : `<a class="botao" href="#/chamados/${c.id}/editar">Editar</a>`}
                <button class="botao perigo" data-excluir>Excluir</button>
            </div>
        </div>

        <div class="duas-colunas largo-esquerda">
            <div>
                <section class="cartao">
                    <h2>Descrição</h2>
                    <p class="texto-longo">${esc(c.descricao)}</p>
                    <dl class="dados">
                        <div><dt>Cliente</dt><dd><a href="#/clientes/${c.clienteId}">${esc(c.clienteNome)}</a></dd></div>
                        <div><dt>Categoria</dt><dd>${esc(c.categoriaNome)}</dd></div>
                        <div><dt>Técnico</dt><dd>${esc(c.tecnicoNome ?? 'Não atribuído')}</dd></div>
                        <div><dt>Aberto em</dt><dd>${formatarData(c.dataAbertura)}</dd></div>
                        <div><dt>Fechado em</dt><dd>${formatarData(c.dataFechamento)}</dd></div>
                    </dl>
                </section>

                <section class="cartao">
                    <h2>Comentários <span class="contador">${comentarios.length}</span></h2>
                    ${comentarios.length === 0
                        ? '<p class="mudo">Nenhum comentário ainda.</p>'
                        : `<ol class="linha-tempo">${comentarios.map((m) => `
                            <li>
                                <p class="meta"><strong>${esc(m.autor)}</strong> · ${formatarData(m.data)}</p>
                                <p class="texto-longo">${esc(m.texto)}</p>
                            </li>`).join('')}
                        </ol>`}
                    ${fechado ? '' : `
                        <form class="formulario" data-form="comentario" novalidate>
                            <div class="erros" hidden></div>
                            <label>Autor <input name="autor" maxlength="100" required></label>
                            <label>Comentário <textarea name="texto" maxlength="1000" rows="3" required></textarea></label>
                            <div class="botoes"><button type="submit" class="botao primario">Comentar</button></div>
                        </form>`}
                </section>
            </div>

            <aside>
                ${fechado
                    ? `<section class="cartao aviso-fechado">
                        <h2>Chamado fechado</h2>
                        <p>Fechado em ${formatarData(c.dataFechamento)}. Não pode mais ser alterado, receber técnico nem comentários.</p>
                    </section>`
                    : `
                    <form class="cartao formulario" data-form="tecnico" novalidate>
                        <h2>Técnico responsável</h2>
                        <div class="erros" hidden></div>
                        ${tecnicos.length === 0
                            ? '<p class="mudo">Nenhum técnico cadastrado. <a href="#/tecnicos">Cadastrar</a></p>'
                            : `<label>Técnico <select name="tecnicoId" required>${opcoes(nomesTecnicos, c.tecnicoId, 'Selecione…')}</select></label>
                               <div class="botoes"><button type="submit" class="botao primario">${c.tecnicoId ? 'Trocar técnico' : 'Atribuir'}</button></div>`}
                    </form>
                    <form class="cartao formulario" data-form="status" novalidate>
                        <h2>Alterar status</h2>
                        <div class="erros" hidden></div>
                        <label>Novo status <select name="status" required>${opcoes(outrosStatus, null)}</select></label>
                        ${c.tecnicoId ? '' : '<p class="dica">Para colocar em atendimento, atribua um técnico antes.</p>'}
                        <div class="botoes"><button type="submit" class="botao primario">Alterar</button></div>
                    </form>`}
            </aside>
        </div>`;

    const recarregar = () => detalhe(conteudo, { id });

    conteudo.querySelector('[data-excluir]').addEventListener('click', async () => {
        if (!confirm(`Excluir o chamado #${c.id}? Os comentários também serão excluídos.`)) return;
        try {
            await api.excluir(`/chamados/${c.id}`);
            aviso('Chamado excluído.');
            location.hash = '#/chamados';
        } catch (erro) {
            mostrarErro(erro);
        }
    });

    ligar('comentario', async (dados) => {
        await api.post(`/chamados/${c.id}/comentarios`, dados);
        aviso('Comentário adicionado.');
    });
    ligar('tecnico', async (dados) => {
        await api.patch(`/chamados/${c.id}/atribuir`, { tecnicoId: dados.tecnicoId && Number(dados.tecnicoId) });
        aviso('Técnico atribuído.');
    });
    ligar('status', async (dados) => {
        await api.patch(`/chamados/${c.id}/status`, dados);
        aviso(`Status alterado para ${STATUS[dados.status]}.`);
    });

    function ligar(nome, acao) {
        const form = conteudo.querySelector(`[data-form="${nome}"]`);
        if (!form?.querySelector('button[type="submit"]')) return;
        form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            enviando(form, async () => {
                await acao(lerFormulario(form));
                await recarregar();
            });
        });
    }
}
