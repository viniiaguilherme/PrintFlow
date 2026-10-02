package br.com.ifmg.ursoscomcurso.printflow.dto;

public record AlertaRequestDTO(
        String titulo,
        String mensagem,
        String nivel,
        Long espacoId) {
}
