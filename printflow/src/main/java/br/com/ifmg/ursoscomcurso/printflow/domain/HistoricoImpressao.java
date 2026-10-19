package br.com.ifmg.ursoscomcurso.printflow.domain;

import java.sql.Timestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "historico_impressoes")
public class HistoricoImpressao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long trabalho_id;
    private String modelo;
    private String resultado;
    private Long impressora_id;
    private String impressora_nome;
    
    @Column(name = "usuario_id")
    private Long usuarioId;
    
    @Column(name = "usuario_nome")
    private String usuarioNome;

    private String material;
    private String cor;
    private Integer peso_gramas;
    private Timestamp finalizado_em;
    private Integer tempo_real;

    public HistoricoImpressao() {}

    public HistoricoImpressao(Long id, Long trabalho_id, String modelo, String resultado, Long impressora_id,
                              String impressora_nome, Long usuarioId, String usuarioNome, String material,
                              String cor, Integer peso_gramas, Timestamp finalizado_em, Integer tempo_real) {
        this.id = id;
        this.trabalho_id = trabalho_id;
        this.modelo = modelo;
        this.resultado = resultado;
        this.impressora_id = impressora_id;
        this.impressora_nome = impressora_nome;
        this.usuarioId = usuarioId;
        this.usuarioNome = usuarioNome;
        this.material = material;
        this.cor = cor;
        this.peso_gramas = peso_gramas;
        this.finalizado_em = finalizado_em;
        this.tempo_real = tempo_real;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTrabalho_id() {
        return trabalho_id;
    }

    public void setTrabalho_id(Long trabalho_id) {
        this.trabalho_id = trabalho_id;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

    public Long getImpressora_id() {
        return impressora_id;
    }

    public void setImpressora_id(Long impressora_id) {
        this.impressora_id = impressora_id;
    }

    public String getImpressora_nome() {
        return impressora_nome;
    }

    public void setImpressora_nome(String impressora_nome) {
        this.impressora_nome = impressora_nome;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public void setUsuarioNome(String usuarioNome) {
        this.usuarioNome = usuarioNome;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getCor() {
        return cor;
    }

    public void setCor(String cor) {
        this.cor = cor;
    }

    public Integer getPeso_gramas() {
        return peso_gramas;
    }

    public void setPeso_gramas(Integer peso_gramas) {
        this.peso_gramas = peso_gramas;
    }

    public Timestamp getFinalizado_em() {
        return finalizado_em;
    }

    public void setFinalizado_em(Timestamp finalizado_em) {
        this.finalizado_em = finalizado_em;
    }

    public Integer getTempo_real() {
        return tempo_real;
    }

    public void setTempo_real(Integer tempo_real) {
        this.tempo_real = tempo_real;
    }
}
