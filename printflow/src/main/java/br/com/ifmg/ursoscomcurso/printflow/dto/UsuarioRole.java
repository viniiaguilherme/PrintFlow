package br.com.ifmg.ursoscomcurso.printflow.dto;

public enum UsuarioRole {
    ADMINISTRADOR("administrador"),
    OPERADOR("operador"),
    MAKER("maker");

    private final String role;

    UsuarioRole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}