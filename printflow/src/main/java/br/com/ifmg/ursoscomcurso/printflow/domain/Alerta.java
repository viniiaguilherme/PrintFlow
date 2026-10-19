package br.com.ifmg.ursoscomcurso.printflow.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "alertas")
public class Alerta {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    @Column(nullable = false)
    private String nivel;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Boolean visualizado = false;

    private LocalDateTime visualizadoEm;

    private Long visualizadoPorUsuarioId;

    @ManyToOne
    @JoinColumn(name = "espaco_id")
    private Espaco espaco;

    public Alerta() {}

    public Alerta(Long id, String titulo, String mensagem, String nivel, LocalDateTime timestamp, Boolean visualizado, LocalDateTime visualizadoEm, Long visualizadoPorUsuarioId, Espaco espaco) {
        this.id = id;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.nivel = nivel;
        this.timestamp = timestamp;
        this.visualizado = visualizado;
        this.visualizadoEm = visualizadoEm;
        this.visualizadoPorUsuarioId = visualizadoPorUsuarioId;
        this.espaco = espaco;
    }

    public Alerta(String titulo, String mensagem, String nivel, Espaco espaco) {
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.nivel = nivel;
        this.timestamp = LocalDateTime.now();
        this.visualizado = false;
        this.espaco = espaco;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Boolean getVisualizado() {
        return visualizado;
    }

    public void setVisualizado(Boolean visualizado) {
        this.visualizado = visualizado;
    }

    public LocalDateTime getVisualizadoEm() {
        return visualizadoEm;
    }

    public void setVisualizadoEm(LocalDateTime visualizadoEm) {
        this.visualizadoEm = visualizadoEm;
    }

    public Long getVisualizadoPorUsuarioId() {
        return visualizadoPorUsuarioId;
    }

    public void setVisualizadoPorUsuarioId(Long visualizadoPorUsuarioId) {
        this.visualizadoPorUsuarioId = visualizadoPorUsuarioId;
    }

    public Espaco getEspaco() {
        return espaco;
    }

    public void setEspaco(Espaco espaco) {
        this.espaco = espaco;
    }
}
