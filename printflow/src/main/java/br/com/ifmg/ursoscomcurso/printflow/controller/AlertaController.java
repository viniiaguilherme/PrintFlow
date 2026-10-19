package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.dto.AlertaRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.AlertaResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.AlertaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas")
@CrossOrigin(origins = "*")
public class AlertaController {

    @Autowired
    private AlertaService alertaService;

    @GetMapping
    public List<AlertaResponseDTO> listarAlertasPendentes() {
        return alertaService.listarAlertasPendentes();
    }

    @PostMapping
    public ResponseEntity<AlertaResponseDTO> criarAlerta(@RequestBody AlertaRequestDTO dto) {
        AlertaResponseDTO salvo = alertaService.criarAlerta(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}/visualizado")
    public ResponseEntity<Void> marcarVisualizado(@PathVariable Long id) {
        alertaService.marcarVisualizado(id);
        return ResponseEntity.noContent().build();
    }
}
