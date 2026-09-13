package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;

public record UsuarioResponseDTO(
    Long id,
    String nome,
    String email,
    String cargo
) {
    public static UsuarioResponseDTO fromEntity(Usuario usuario) {
        return new UsuarioResponseDTO(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getRole() != null ? usuario.getRole().getRole() : null
        );
    }
}
