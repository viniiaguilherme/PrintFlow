package br.com.ifmg.ursoscomcurso.printflow.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "espacos")
public class Espaco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String responsavel;
    private String status;
    private String codigo;
    private String descricao;
    private String senha;

    public Espaco() {}

    public Espaco(Long id, String nome, String responsavel, String status) {
        this.id = id;
        this.nome = nome;
        this.responsavel = responsavel;
        this.status = status;
    }

    public Espaco(Long id, String nome, String responsavel, String status, String codigo, String descricao, String senha) {
        this.id = id;
        this.nome = nome;
        this.responsavel = responsavel;
        this.status = status;
        this.codigo = codigo;
        this.descricao = descricao;
        this.senha = senha;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(String responsavel) {
        this.responsavel = responsavel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
