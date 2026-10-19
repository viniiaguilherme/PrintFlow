package br.com.ifmg.ursoscomcurso.printflow.dto;

import java.sql.Timestamp;

public record HistoricoImpressaoRequestDTO(
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
) {}
