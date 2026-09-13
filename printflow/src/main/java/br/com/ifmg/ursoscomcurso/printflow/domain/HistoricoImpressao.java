package br.com.ifmg.ursoscomcurso.printflow.domain;

import java.sql.Timestamp;

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
    private String resultado;
    private Long impressora_id;
    private Timestamp finalizado_em;
    private Integer tempo_real;

    public HistoricoImpressao() {}

    public HistoricoImpressao(Long id, Long trabalho_id, String resultado, Long impressora_id, Timestamp finalizado_em, Integer tempo_real) {
        this.id = id;
        this.trabalho_id = trabalho_id;
        this.resultado = resultado;
        this.impressora_id = impressora_id;
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
