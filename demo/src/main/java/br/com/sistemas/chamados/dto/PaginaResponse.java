package br.com.sistemas.chamados.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/** Contrato estável para respostas paginadas, sem expor a classe Page do Spring. */
public record PaginaResponse<T>(
        List<T> conteudo,
        int pagina,
        int tamanho,
        long totalElementos,
        int totalPaginas
) {
    public static <T> PaginaResponse<T> de(Page<T> page) {
        return new PaginaResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
