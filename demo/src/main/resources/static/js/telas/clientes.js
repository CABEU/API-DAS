/** Telas de Clientes: Lista / Novo / Editar / Detalhe. */
import { api } from '../api.js';
import { aviso, badgePrioridade, badgeStatus, enviando, esc, formatarData, lerFormulario, mostrarErro, vazio } from '../ui.js';

export async function lista(conteudo) {
    const clientes = await api.get('/clientes');

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <h1>Clientes</h1>
            <a class="botao primario" href="#/clientes/novo">Novo cliente</a>
        </div>
        <section class="cartao">
            ${clientes.length === 0
                ? vazio('Nenhum cliente cadastrado ainda.', '<a class="botao primario" href="#/clientes/novo">Cadastrar o primeiro</a>')
                : `<div class="tabela-rolagem"><table>
                    <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th class="acoes">Ações</th></tr></thead>
                    <tbody>${clientes.map((c) => `
                        <tr>
                            <td><a href="#/clientes/${c.id}">${esc(c.nome)}</a></td>
                            <td>${esc(c.email)}</td>
                            <td>${esc(c.telefone ?? '—')}</td>
                            <td class="acoes">
                                <a class="botao pequeno" href="#/clientes/${c.id}/editar">Editar</a>
                                <button class="botao pequeno perigo" data-excluir="${c.id}" data-nome="${esc(c.nome)}">Excluir</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>`}
        </section>`;

    conteudo.querySelectorAll('[data-excluir]').forEach((botao) => {
        botao.addEventListener('click', async () => {
            if (!confirm(`Excluir o cliente ${botao.dataset.nome}?`)) return;
            try {
                await api.excluir(`/clientes/${botao.dataset.excluir}`);
                aviso('Cliente excluído.');
                await lista(conteudo);
            } catch (erro) {
                mostrarErro(erro);
            }
        });
    });
}

export async function formulario(conteudo, { id }) {
    const cliente = id ? await api.get(`/clientes/${id}`) : { nome: '', email: '', telefone: '' };

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <h1>${id ? 'Editar cliente' : 'Novo cliente'}</h1>
        </div>
        <form class="cartao formulario" novalidate>
            <div class="erros" hidden></div>
            <label>Nome
                <input name="nome" maxlength="100" required value="${esc(cliente.nome)}">
            </label>
            <label>E-mail
                <input name="email" type="email" required value="${esc(cliente.email)}">
            </label>
            <label>Telefone <span class="opcional">(opcional)</span>
                <input name="telefone" maxlength="20" value="${esc(cliente.telefone ?? '')}">
            </label>
            <div class="botoes">
                <button type="submit" class="botao primario">Salvar</button>
                <a class="botao" href="${id ? `#/clientes/${id}` : '#/clientes'}">Cancelar</a>
            </div>
        </form>`;

    const form = conteudo.querySelector('form');
    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        enviando(form, async () => {
            const dados = lerFormulario(form);
            const salvo = id ? await api.put(`/clientes/${id}`, dados) : await api.post('/clientes', dados);
            aviso(id ? 'Cliente atualizado.' : 'Cliente cadastrado.');
            location.hash = `#/clientes/${salvo.id}`;
        });
    });
}

export async function detalhe(conteudo, { id }) {
    const [cliente, chamados] = await Promise.all([
        api.get(`/clientes/${id}`),
        api.get(`/clientes/${id}/chamados?size=50`),
    ]);

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <h1>${esc(cliente.nome)}</h1>
            <a class="botao" href="#/clientes/${id}/editar">Editar</a>
        </div>
        <section class="cartao">
            <dl class="dados">
                <div><dt>E-mail</dt><dd>${esc(cliente.email)}</dd></div>
                <div><dt>Telefone</dt><dd>${esc(cliente.telefone ?? '—')}</dd></div>
                <div><dt>Chamados</dt><dd>${chamados.totalElementos}</dd></div>
            </dl>
        </section>
        <section class="cartao">
            <div class="titulo-secao">
                <h2>Chamados do cliente</h2>
                <a class="botao primario" href="#/chamados/novo?clienteId=${id}">Abrir chamado</a>
            </div>
            ${chamados.conteudo.length === 0
                ? vazio('Este cliente ainda não abriu chamados.')
                : `<div class="tabela-rolagem"><table>
                    <thead><tr><th>#</th><th>Título</th><th>Status</th><th>Prioridade</th><th>Abertura</th></tr></thead>
                    <tbody>${chamados.conteudo.map((c) => `
                        <tr>
                            <td>${c.id}</td>
                            <td><a href="#/chamados/${c.id}">${esc(c.titulo)}</a></td>
                            <td>${badgeStatus(c.status)}</td>
                            <td>${badgePrioridade(c.prioridade)}</td>
                            <td>${formatarData(c.dataAbertura)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>`}
        </section>`;
}
