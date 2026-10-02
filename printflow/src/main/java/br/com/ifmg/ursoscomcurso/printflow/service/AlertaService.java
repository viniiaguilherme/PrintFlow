package br.com.ifmg.ursoscomcurso.printflow.service;

import br.com.ifmg.ursoscomcurso.printflow.domain.Alerta;
import br.com.ifmg.ursoscomcurso.printflow.domain.Espaco;
import br.com.ifmg.ursoscomcurso.printflow.dto.AlertaRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.AlertaResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.repository.AlertaRepository;
import br.com.ifmg.ursoscomcurso.printflow.repository.EspacoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertaService {

    @Autowired
    private AlertaRepository alertaRepository;

    @Autowired
    private EspacoRepository espacoRepository;

    public AlertaResponseDTO criarAlerta(AlertaRequestDTO request) {
        Espaco espaco = espacoRepository.findById(request.espacoId())
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado"));

        Alerta alerta = new Alerta(
                request.titulo(),
                request.mensagem(),
                request.nivel(),
                espaco);

        Alerta salvo = alertaRepository.save(alerta);
        return toResponseDTO(salvo);
    }

    public List<AlertaResponseDTO> listarAlertasPendentes() {
        List<Alerta> alertas = alertaRepository.findByVisualizadoFalse(
                Sort.by(Sort.Direction.DESC, "timestamp"));
        return alertas.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public void marcarVisualizado(Long id) {
        Alerta alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta não encontrado"));

        alerta.setVisualizado(true);
        alerta.setVisualizadoEm(LocalDateTime.now());
        alertaRepository.save(alerta);
    }

    private AlertaResponseDTO toResponseDTO(Alerta alerta) {
        return new AlertaResponseDTO(
                alerta.getId(),
                alerta.getTitulo(),
                alerta.getMensagem(),
                alerta.getNivel(),
                alerta.getTimestamp(),
                alerta.getVisualizado(),
                alerta.getVisualizadoEm(),
                alerta.getEspaco() != null ? alerta.getEspaco().getNome() : null);
    }
}
