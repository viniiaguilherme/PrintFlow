package br.com.ifmg.ursoscomcurso.printflow.dto;

import java.time.LocalDateTime;

public record AlertaResponseDTO(
        Long id,
        String titulo,
        String mensagem,
        String nivel,
        LocalDateTime timestamp,
        Boolean visualizado,
        LocalDateTime visualizadoEm,
        String espacoNome) {
}
