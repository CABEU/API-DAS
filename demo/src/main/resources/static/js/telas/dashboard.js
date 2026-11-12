/** Dashboard: visão geral dos chamados por status e prioridade. */
import { api } from '../api.js';
import { PRIORIDADE, STATUS, aviso, badgePrioridade, badgeStatus, esc, formatarData, mostrarErro } from '../ui.js';

export async function painel(conteudo) {
    const [pagina, clientes, categorias, tecnicos] = await Promise.all([
        api.get('/chamados?size=1000&sort=dataAbertura,desc'),
        api.get('/clientes'),
        api.get('/categorias'),
        api.get('/tecnicos'),
    ]);
    const chamados = pagina.conteudo;

    const contar = (campo, valor) => chamados.filter((c) => c[campo] === valor).length;
    const semTecnico = chamados.filter((c) => !c.tecnicoId && c.status !== 'FECHADO').length;
    const maiorPrioridade = Math.max(1, ...Object.keys(PRIORIDADE).map((p) => contar('prioridade', p)));
    const bancoVazio = clientes.length + categorias.length + tecnicos.length + chamados.length === 0;

    conteudo.innerHTML = `
        <div class="titulo-pagina">
            <h1>Dashboard</h1>
            <a class="botao primario" href="#/chamados/novo">Abrir chamado</a>
        </div>

        ${bancoVazio ? `
            <section class="cartao destaque">
                <h2>O banco está vazio</h2>
                <p>O H2 roda em memória e perde os dados a cada reinício da aplicação.
                   Para explorar as telas, carregue alguns registros de exemplo pela própria API.</p>
                <p><button class="botao primario" data-exemplo>Carregar dados de exemplo</button></p>
            </section>` : ''}

        <section class="indicadores">
            ${Object.entries(STATUS).map(([valor, rotulo]) => `
                <a class="indicador status-${valor.toLowerCase()}" href="#/chamados?status=${valor}">
                    <span class="numero">${contar('status', valor)}</span>
                    <span class="rotulo">${esc(rotulo)}</span>
                </a>`).join('')}
        </section>

        <div class="duas-colunas">
            <section class="cartao">
                <h2>Por prioridade</h2>
                <ul class="barras">
                    ${Object.entries(PRIORIDADE).map(([valor, rotulo]) => {
                        const total = contar('prioridade', valor);
                        return `<li>
                            <a href="#/chamados?prioridade=${valor}">${esc(rotulo)}</a>
                            <span class="barra"><span class="preenchimento prioridade-${valor.toLowerCase()}" style="width:${(total / maiorPrioridade) * 100}%"></span></span>
                            <span class="valor">${total}</span>
                        </li>`;
                    }).join('')}
                </ul>
            </section>
            <section class="cartao">
                <h2>Resumo</h2>
                <dl class="dados">
                    <div><dt>Chamados no total</dt><dd>${pagina.totalElementos}</dd></div>
                    <div><dt>Em aberto sem técnico</dt><dd>${semTecnico}</dd></div>
                    <div><dt>Clientes</dt><dd><a href="#/clientes">${clientes.length}</a></dd></div>
                    <div><dt>Categorias</dt><dd><a href="#/categorias">${categorias.length}</a></dd></div>
                    <div><dt>Técnicos</dt><dd><a href="#/tecnicos">${tecnicos.length}</a></dd></div>
                </dl>
            </section>
        </div>

        <section class="cartao">
            <div class="titulo-secao">
                <h2>Chamados recentes</h2>
                <a href="#/chamados">Ver todos →</a>
            </div>
            ${chamados.length === 0
                ? '<p class="mudo">Nenhum chamado aberto ainda.</p>'
                : `<div class="tabela-rolagem"><table>
                    <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Status</th><th>Prioridade</th><th>Abertura</th></tr></thead>
                    <tbody>${chamados.slice(0, 5).map((c) => `
                        <tr>
                            <td>${c.id}</td>
                            <td><a href="#/chamados/${c.id}">${esc(c.titulo)}</a></td>
                            <td>${esc(c.clienteNome)}</td>
                            <td>${badgeStatus(c.status)}</td>
                            <td>${badgePrioridade(c.prioridade)}</td>
                            <td>${formatarData(c.dataAbertura)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>`}
        </section>`;

    conteudo.querySelector('[data-exemplo]')?.addEventListener('click', async (evento) => {
        evento.target.disabled = true;
        try {
            await carregarExemplos();
            aviso('Dados de exemplo carregados.');
            await painel(conteudo);
        } catch (erro) {
            mostrarErro(erro);
            evento.target.disabled = false;
        }
    });
}

/** Cria registros de exemplo usando as mesmas rotas que as telas usam. */
async function carregarExemplos() {
    const [ana, bruno, carla] = await Promise.all([
        api.post('/clientes', { nome: 'Ana Souza', email: 'ana@exemplo.com', telefone: '47999990001' }),
        api.post('/clientes', { nome: 'Bruno Lima', email: 'bruno@exemplo.com', telefone: '47999990002' }),
        api.post('/clientes', { nome: 'Carla Mendes', email: 'carla@exemplo.com', telefone: null }),
    ]);
    const [hardware, software, rede] = await Promise.all([
        api.post('/categorias', { nome: 'Hardware', descricao: 'Computadores, monitores e periféricos' }),
        api.post('/categorias', { nome: 'Software', descricao: 'Sistemas e programas instalados' }),
        api.post('/categorias', { nome: 'Rede', descricao: 'Internet, Wi-Fi e cabeamento' }),
    ]);
    const [diego] = await Promise.all([
        api.post('/tecnicos', { nome: 'Diego Ramos', email: 'diego@exemplo.com', perfil: 'TECNICO' }),
        api.post('/tecnicos', { nome: 'Elisa Prado', email: 'elisa@exemplo.com', perfil: 'ADMIN' }),
    ]);

    const abrir = (titulo, descricao, prioridade, cliente, categoria) =>
        api.post('/chamados', { titulo, descricao, prioridade, clienteId: cliente.id, categoriaId: categoria.id });

    const pc = await abrir('Computador não liga', 'A estação do laboratório não apresenta imagem.', 'ALTA', ana, hardware);
    const wifi = await abrir('Wi-Fi caindo', 'A conexão cai várias vezes por hora na sala 12.', 'CRITICA', bruno, rede);
    const office = await abrir('Erro ao abrir planilhas', 'O editor fecha sozinho ao abrir arquivos grandes.', 'MEDIA', carla, software);
    await abrir('Mouse com defeito', 'O botão direito não responde.', 'BAIXA', ana, hardware);

    await api.patch(`/chamados/${pc.id}/atribuir`, { tecnicoId: diego.id });
    await api.patch(`/chamados/${pc.id}/status`, { status: 'EM_ATENDIMENTO' });
    await api.post(`/chamados/${pc.id}/comentarios`, { autor: diego.nome, texto: 'Fonte com defeito, troca agendada.' });

    await api.patch(`/chamados/${office.id}/atribuir`, { tecnicoId: diego.id });
    await api.post(`/chamados/${office.id}/comentarios`, { autor: diego.nome, texto: 'Versão atualizada, problema resolvido.' });
    await api.patch(`/chamados/${office.id}/status`, { status: 'FECHADO' });

    await api.patch(`/chamados/${wifi.id}/status`, { status: 'AGUARDANDO_CLIENTE' });
}
