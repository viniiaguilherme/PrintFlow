package br.com.ifmg.ursoscomcurso.printflow.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "alertas")
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    public Alerta(String titulo, String mensagem, String nivel, Espaco espaco) {
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.nivel = nivel;
        this.timestamp = LocalDateTime.now();
        this.espaco = espaco;
    }
}
