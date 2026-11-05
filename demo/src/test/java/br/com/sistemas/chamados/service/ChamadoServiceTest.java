package br.com.sistemas.chamados.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.exception.ChamadoFechadoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.repository.CategoriaRepository;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ClienteRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;
import br.com.sistemas.chamados.repository.TecnicoRepository;

/** Testa as regras de transição de status sem subir o Spring nem o banco. */
@ExtendWith(MockitoExtension.class)
class ChamadoServiceTest {

    @Mock private ChamadoRepository repository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private CategoriaRepository categoriaRepository;
    @Mock private TecnicoRepository tecnicoRepository;
    @Mock private ComentarioRepository comentarioRepository;

    @InjectMocks
    private ChamadoService service;

    private Chamado chamado;

    @BeforeEach
    void preparar() {
        chamado = new Chamado();
        chamado.setTitulo("PC não liga");
        chamado.setDescricao("Sem imagem");
        chamado.setPrioridade(Prioridade.ALTA);
        chamado.setStatus(StatusChamado.ABERTO);
        chamado.setDataAbertura(LocalDateTime.now());
        chamado.setCliente(new Cliente("Ana", "ana@exemplo.com", null));
        chamado.setCategoria(new Categoria("Hardware", null));
        when(repository.findById(1L)).thenReturn(Optional.of(chamado));
    }

    @Test
    void fecharPreencheDataFechamento() {
        ChamadoResponse resposta = service.alterarStatus(1L, StatusChamado.FECHADO);

        assertThat(resposta.status()).isEqualTo(StatusChamado.FECHADO);
        assertThat(resposta.dataFechamento()).isNotNull();
    }

    @Test
    void chamadoFechadoNaoMudaDeStatus() {
        chamado.setStatus(StatusChamado.FECHADO);

        assertThatThrownBy(() -> service.alterarStatus(1L, StatusChamado.ABERTO))
                .isInstanceOf(ChamadoFechadoException.class);
    }

    @Test
    void chamadoFechadoNaoRecebeTecnico() {
        chamado.setStatus(StatusChamado.FECHADO);

        assertThatThrownBy(() -> service.atribuirTecnico(1L, 7L))
                .isInstanceOf(ChamadoFechadoException.class);
    }

    @Test
    void emAtendimentoExigeTecnico() {
        assertThatThrownBy(() -> service.alterarStatus(1L, StatusChamado.EM_ATENDIMENTO))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("técnico");
    }

    @Test
    void emAtendimentoComTecnicoEhPermitido() {
        chamado.setTecnico(new Tecnico("Carlos", "carlos@exemplo.com", Perfil.TECNICO));

        assertThat(service.alterarStatus(1L, StatusChamado.EM_ATENDIMENTO).status())
                .isEqualTo(StatusChamado.EM_ATENDIMENTO);
    }

    @Test
    void mesmoStatusEhRejeitado() {
        assertThatThrownBy(() -> service.alterarStatus(1L, StatusChamado.ABERTO))
                .isInstanceOf(RegraNegocioException.class);
    }
}
