package br.com.ifmg.ursoscomcurso.printflow.dto;


import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
    @NotBlank String email,
    @NotBlank String senha
) {}
