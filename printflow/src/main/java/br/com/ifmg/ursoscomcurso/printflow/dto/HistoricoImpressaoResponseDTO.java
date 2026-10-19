package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.HistoricoImpressao;
import java.sql.Timestamp;

public record HistoricoImpressaoResponseDTO(
    Long id,
    Long trabalho_id,
    String modelo,
    String resultado,
    Long impressora_id,
    String impressora_nome,
    Long usuario_id,
    String usuario_nome,
    String material,
    String cor,
    Integer peso_gramas,
    Timestamp finalizado_em,
    Integer tempo_real
) {
    public static HistoricoImpressaoResponseDTO fromEntity(HistoricoImpressao h) {
        return new HistoricoImpressaoResponseDTO(
            h.getId(),
            h.getTrabalho_id(),
            h.getModelo() != null ? h.getModelo() : "Modelo #" + (h.getTrabalho_id() != null ? h.getTrabalho_id() : h.getId()),
            h.getResultado() != null ? h.getResultado() : "Concluído",
            h.getImpressora_id(),
            h.getImpressora_nome() != null ? h.getImpressora_nome() : "Impressora Padrão",
            h.getUsuarioId(),
            h.getUsuarioNome() != null ? h.getUsuarioNome() : "Maker",
            h.getMaterial() != null ? h.getMaterial() : "PLA",
            h.getCor() != null ? h.getCor() : "Preto",
            h.getPeso_gramas() != null ? h.getPeso_gramas() : 35,
            h.getFinalizado_em() != null ? h.getFinalizado_em() : new Timestamp(System.currentTimeMillis()),
            h.getTempo_real() != null ? h.getTempo_real() : 45
        );
    }
}
