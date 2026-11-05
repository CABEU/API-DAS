package br.com.sistemas.chamados.dto;

import java.util.List;

import br.com.sistemas.chamados.entity.Chamado;

/** Usado em GET /chamados/{id}: dados do chamado mais o histórico de comentários. */
public record ChamadoDetalheResponse(ChamadoResponse chamado, List<ComentarioResponse> comentarios) {
    public static ChamadoDetalheResponse de(Chamado c) {
        return new ChamadoDetalheResponse(
                ChamadoResponse.de(c),
                c.getComentarios().stream().map(ComentarioResponse::de).toList());
    }
}
