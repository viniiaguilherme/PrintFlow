package br.com.ifmg.ursoscomcurso.printflow.dto;

public record UsuarioRequestDTO(
    String nome,
    String email,
    UsuarioRole role,
    String senha
) {}
