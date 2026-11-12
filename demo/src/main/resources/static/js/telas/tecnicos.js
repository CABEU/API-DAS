/** Tela de Técnicos: Lista / Cadastro (o formulário fica na própria tela). */
import { api } from '../api.js';
import { PERFIL, aviso, enviando, esc, lerFormulario, mostrarErro, opcoes, vazio } from '../ui.js';

export async function lista(conteudo, { id }) {
    const tecnicos = await api.get('/tecnicos');
    const emEdicao = id ? tecnicos.find((t) => t.id === id) : null;

    conteudo.innerHTML = `
        <div class="titulo-pagina"><h1>Técnicos</h1></div>
        <div class="duas-colunas">
            <form class="cartao formulario" novalidate>
                <h2>${emEdicao ? 'Editar técnico' : 'Novo técnico'}</h2>
                <div class="erros" hidden></div>
                <label>Nome
                    <input name="nome" maxlength="100" required value="${esc(emEdicao?.nome ?? '')}">
                </label>
                <label>E-mail
                    <input name="email" type="email" required value="${esc(emEdicao?.email ?? '')}">
                </label>
                <label>Perfil
                    <select name="perfil" required>${opcoes(PERFIL, emEdicao?.perfil ?? 'TECNICO')}</select>
                </label>
                <div class="botoes">
                    <button type="submit" class="botao primario">${emEdicao ? 'Salvar alterações' : 'Cadastrar'}</button>
                    ${emEdicao ? '<a class="botao" href="#/tecnicos">Cancelar</a>' : ''}
                </div>
            </form>
            <section class="cartao">
                <h2>Equipe</h2>
                ${tecnicos.length === 0
                    ? vazio('Nenhum técnico cadastrado ainda.')
                    : `<ul class="lista-itens">${tecnicos.map((t) => `
                        <li class="${t.id === id ? 'selecionado' : ''}">
                            <div>
                                <strong>${esc(t.nome)}</strong>
                                <span class="badge perfil-${t.perfil.toLowerCase()}">${esc(PERFIL[t.perfil])}</span>
                                <p>${esc(t.email)}</p>
                            </div>
                            <div class="acoes">
                                <a class="botao pequeno" href="#/tecnicos/${t.id}/editar">Editar</a>
                                <button class="botao pequeno perigo" data-excluir="${t.id}" data-nome="${esc(t.nome)}">Excluir</button>
                            </div>
                        </li>`).join('')}
                    </ul>`}
            </section>
        </div>`;

    const form = conteudo.querySelector('form');
    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        enviando(form, async () => {
            const dados = lerFormulario(form);
            if (emEdicao) {
                await api.put(`/tecnicos/${id}`, dados);
                aviso('Técnico atualizado.');
                location.hash = '#/tecnicos';
            } else {
                await api.post('/tecnicos', dados);
                aviso('Técnico cadastrado.');
                await lista(conteudo, {});
            }
        });
    });

    conteudo.querySelectorAll('[data-excluir]').forEach((botao) => {
        botao.addEventListener('click', async () => {
            if (!confirm(`Excluir o técnico ${botao.dataset.nome}?`)) return;
            try {
                await api.excluir(`/tecnicos/${botao.dataset.excluir}`);
                aviso('Técnico excluído.');
                if (id) location.hash = '#/tecnicos';
                else await lista(conteudo, {});
            } catch (erro) {
                mostrarErro(erro);
            }
        });
    });
}
