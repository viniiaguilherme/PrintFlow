package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.Espaco;

public record EspacoResponseDTO(
    Long id,
    String nome,
    String responsavel,
    String status,
    String codigo,
    String descricao
) {
    public static EspacoResponseDTO fromEntity(Espaco espaco) {
        return new EspacoResponseDTO(
            espaco.getId(),
            espaco.getNome(),
            espaco.getResponsavel(),
            espaco.getStatus(),
            espaco.getCodigo(),
            espaco.getDescricao()
        );
    }
}
