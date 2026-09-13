package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.Impressora;

public record ImpressoraResponseDTO(
    Long id,
    String nome,
    String modelo,
    String material_padrao,
    String status
) {
    public static ImpressoraResponseDTO fromEntity(Impressora impressora) {
        return new ImpressoraResponseDTO(
            impressora.getId(),
            impressora.getNome(),
            impressora.getModelo(),
            impressora.getMaterial_padrao(),
            impressora.getStatus()
        );
    }
}
