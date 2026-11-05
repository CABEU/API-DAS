package br.com.sistemas.chamados.exception;

/**
 * Lançada quando se tenta alterar um chamado que já está FECHADO (vira HTTP 409).
 */
public class ChamadoFechadoException extends RuntimeException {
    public ChamadoFechadoException(Long id) {
        super("Chamado " + id + " está fechado e não pode ser alterado");
    }
}
