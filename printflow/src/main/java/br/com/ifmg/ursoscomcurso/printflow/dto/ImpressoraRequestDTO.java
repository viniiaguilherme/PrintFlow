package br.com.ifmg.ursoscomcurso.printflow.dto;

public record ImpressoraRequestDTO(
    String nome,
    String modelo,
    String material_padrao,
    String status
) {}
