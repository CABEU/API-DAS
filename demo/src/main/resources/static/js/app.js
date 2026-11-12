/**
 * Roteador do front-end.
 * Cada endereço depois do # (ex.: #/chamados/3) é ligado a uma tela.
 * As telas ficam em js/telas e seguem o mapa de telas do guia:
 * Dashboard → Clientes / Categorias / Técnicos → Chamados → Detalhe do chamado.
 */
import { esc, mostrarErro } from './ui.js';
import * as dashboard from './telas/dashboard.js';
import * as clientes from './telas/clientes.js';
import * as categorias from './telas/categorias.js';
import * as tecnicos from './telas/tecnicos.js';
import * as chamados from './telas/chamados.js';

const rotas = [
    { padrao: /^\/?$/, tela: dashboard.painel },
    { padrao: /^\/dashboard$/, tela: dashboard.painel },

    { padrao: /^\/clientes$/, tela: clientes.lista },
    { padrao: /^\/clientes\/novo$/, tela: clientes.formulario },
    { padrao: /^\/clientes\/(\d+)$/, tela: clientes.detalhe },
    { padrao: /^\/clientes\/(\d+)\/editar$/, tela: clientes.formulario },

    { padrao: /^\/categorias$/, tela: categorias.lista },
    { padrao: /^\/categorias\/(\d+)\/editar$/, tela: categorias.lista },

    { padrao: /^\/tecnicos$/, tela: tecnicos.lista },
    { padrao: /^\/tecnicos\/(\d+)\/editar$/, tela: tecnicos.lista },

    { padrao: /^\/chamados$/, tela: chamados.lista },
    { padrao: /^\/chamados\/novo$/, tela: chamados.formulario },
    { padrao: /^\/chamados\/(\d+)$/, tela: chamados.detalhe },
    { padrao: /^\/chamados\/(\d+)\/editar$/, tela: chamados.formulario },
];

const conteudo = document.getElementById('conteudo');

async function navegar() {
    const [caminho, busca = ''] = location.hash.replace(/^#/, '').split('?');
    const query = new URLSearchParams(busca);

    marcarMenu(caminho);

    for (const { padrao, tela } of rotas) {
        const encontrado = caminho.match(padrao);
        if (encontrado) {
            const id = encontrado[1] ? Number(encontrado[1]) : null;
            conteudo.innerHTML = '<p class="carregando">Carregando…</p>';
            try {
                await tela(conteudo, { id, query });
            } catch (erro) {
                conteudo.innerHTML = `<section class="cartao">
                    <h1>Não foi possível abrir esta tela</h1>
                    <p>${esc(erro.message)}</p>
                    <p><a class="botao" href="#/dashboard">Voltar ao início</a></p>
                </section>`;
                mostrarErro(erro);
            }
            conteudo.focus({ preventScroll: true });
            window.scrollTo(0, 0);
            return;
        }
    }

    conteudo.innerHTML = `<section class="cartao"><h1>Página não encontrada</h1>
        <p><a class="botao" href="#/dashboard">Voltar ao início</a></p></section>`;
}

function marcarMenu(caminho) {
    const secao = caminho.split('/')[1] || 'dashboard';
    document.querySelectorAll('.menu a').forEach((link) => {
        link.classList.toggle('ativo', link.dataset.secao === secao);
    });
}

window.addEventListener('hashchange', navegar);
navegar();
