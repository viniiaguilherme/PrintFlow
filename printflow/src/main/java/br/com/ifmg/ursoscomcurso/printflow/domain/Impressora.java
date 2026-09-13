package br.com.ifmg.ursoscomcurso.printflow.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "impressoras")
public class Impressora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String modelo;
    private String material_padrao;
    private String status;

    public Impressora() {}

    public Impressora(Long id, String nome, String modelo, String material_padrao, String status) {
        this.id = id;
        this.nome = nome;
        this.modelo = modelo;
        this.material_padrao = material_padrao;
        this.status = status;
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

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getMaterial_padrao() {
        return material_padrao;
    }

    public void setMaterial_padrao(String material_padrao) {
        this.material_padrao = material_padrao;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
