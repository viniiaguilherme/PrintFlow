package br.com.ifmg.ursoscomcurso.printflow.dto;

import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;

public record LoginResponseDTO(Long id, String nome, String email, String perfil, String token) {

    public static LoginResponseDTO fromEntity(Usuario usuario, String token) {
        String roleStr = usuario.getRole() != null ? usuario.getRole().name() : "OPERADOR";
        return new LoginResponseDTO(usuario.getId(), usuario.getNome(), usuario.getEmail(), roleStr, token);
    }
}