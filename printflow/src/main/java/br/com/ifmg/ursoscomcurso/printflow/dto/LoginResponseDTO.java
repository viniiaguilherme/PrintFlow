package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;

public record LoginResponseDTO(Long id, String token) {

    public static LoginResponseDTO fromEntity(Usuario usuario, String token) {
        return new LoginResponseDTO(usuario.getId(), token);
    }
}