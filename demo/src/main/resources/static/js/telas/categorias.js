/** Tela de Categorias: Lista / Cadastro (o formulário fica na própria tela). */
import { api } from '../api.js';
import { aviso, enviando, esc, lerFormulario, mostrarErro, vazio } from '../ui.js';

export async function lista(conteudo, { id }) {
    const categorias = await api.get('/categorias');
    const emEdicao = id ? categorias.find((c) => c.id === id) : null;

    conteudo.innerHTML = `
        <div class="titulo-pagina"><h1>Categorias</h1></div>
        <div class="duas-colunas">
            <form class="cartao formulario" novalidate>
                <h2>${emEdicao ? 'Editar categoria' : 'Nova categoria'}</h2>
                <div class="erros" hidden></div>
                <label>Nome
                    <input name="nome" maxlength="60" required value="${esc(emEdicao?.nome ?? '')}">
                </label>
                <label>Descrição <span class="opcional">(opcional)</span>
                    <textarea name="descricao" maxlength="255" rows="3">${esc(emEdicao?.descricao ?? '')}</textarea>
                </label>
                <div class="botoes">
                    <button type="submit" class="botao primario">${emEdicao ? 'Salvar alterações' : 'Cadastrar'}</button>
                    ${emEdicao ? '<a class="botao" href="#/categorias">Cancelar</a>' : ''}
                </div>
            </form>
            <section class="cartao">
                <h2>Cadastradas</h2>
                ${categorias.length === 0
                    ? vazio('Nenhuma categoria cadastrada ainda.')
                    : `<ul class="lista-itens">${categorias.map((c) => `
                        <li class="${c.id === id ? 'selecionado' : ''}">
                            <div>
                                <strong>${esc(c.nome)}</strong>
                                ${c.descricao ? `<p>${esc(c.descricao)}</p>` : ''}
                            </div>
                            <div class="acoes">
                                <a class="botao pequeno" href="#/categorias/${c.id}/editar">Editar</a>
                                <button class="botao pequeno perigo" data-excluir="${c.id}" data-nome="${esc(c.nome)}">Excluir</button>
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
                await api.put(`/categorias/${id}`, dados);
                aviso('Categoria atualizada.');
                location.hash = '#/categorias';
            } else {
                await api.post('/categorias', dados);
                aviso('Categoria cadastrada.');
                await lista(conteudo, {});
            }
        });
    });

    conteudo.querySelectorAll('[data-excluir]').forEach((botao) => {
        botao.addEventListener('click', async () => {
            if (!confirm(`Excluir a categoria ${botao.dataset.nome}?`)) return;
            try {
                await api.excluir(`/categorias/${botao.dataset.excluir}`);
                aviso('Categoria excluída.');
                if (id) location.hash = '#/categorias';
                else await lista(conteudo, {});
            } catch (erro) {
                mostrarErro(erro);
            }
        });
    });
}
