package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;

@DataJpaTest
class ChamadoRepositoryTest {

    @Autowired
    private ChamadoRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    private Cliente ana;
    private Cliente bia;

    @BeforeEach
    void preparar() {
        ana = clienteRepository.save(new Cliente("Ana", "ana@exemplo.com", null));
        bia = clienteRepository.save(new Cliente("Bia", "bia@exemplo.com", null));
        Categoria hardware = categoriaRepository.save(new Categoria("Hardware", null));

        salvar("PC não liga", ana, hardware, Prioridade.ALTA, StatusChamado.ABERTO);
        salvar("Mouse quebrado", ana, hardware, Prioridade.BAIXA, StatusChamado.FECHADO);
        salvar("Monitor piscando", bia, hardware, Prioridade.ALTA, StatusChamado.ABERTO);
    }

    @Test
    void semFiltrosRetornaTodos() {
        Page<Chamado> pagina = repository.filtrar(null, null, null, PageRequest.of(0, 10));
        assertThat(pagina.getTotalElements()).isEqualTo(3);
    }

    @Test
    void filtraPorStatusEPrioridade() {
        Page<Chamado> pagina = repository.filtrar(StatusChamado.ABERTO, Prioridade.ALTA, null, PageRequest.of(0, 10));
        assertThat(pagina.getContent()).extracting(Chamado::getTitulo)
                .containsExactlyInAnyOrder("PC não liga", "Monitor piscando");
    }

    @Test
    void combinaOsTresFiltros() {
        Page<Chamado> pagina = repository.filtrar(StatusChamado.ABERTO, Prioridade.ALTA, ana.getId(), PageRequest.of(0, 10));
        assertThat(pagina.getContent()).extracting(Chamado::getTitulo).containsExactly("PC não liga");
    }

    @Test
    void paginaOResultado() {
        Page<Chamado> pagina = repository.filtrar(null, null, null, PageRequest.of(0, 2));
        assertThat(pagina.getContent()).hasSize(2);
        assertThat(pagina.getTotalPages()).isEqualTo(2);
    }

    @Test
    void buscaChamadosDoCliente() {
        assertThat(repository.findByClienteId(bia.getId(), PageRequest.of(0, 10)).getTotalElements()).isEqualTo(1);
        assertThat(repository.existsByClienteId(ana.getId())).isTrue();
    }

    private void salvar(String titulo, Cliente cliente, Categoria categoria, Prioridade prioridade, StatusChamado status) {
        Chamado c = new Chamado();
        c.setTitulo(titulo);
        c.setDescricao("Descrição de " + titulo);
        c.setCliente(cliente);
        c.setCategoria(categoria);
        c.setPrioridade(prioridade);
        c.setStatus(status);
        c.setDataAbertura(LocalDateTime.now());
        repository.save(c);
    }
}
