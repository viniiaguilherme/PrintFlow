package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.dto.ImpressoraRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.ImpressoraResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.ImpressoraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/impressora")
@CrossOrigin(origins = "*")
public class ImpressoraController {

    @Autowired
    private ImpressoraService impressoraService;

    @GetMapping
    public List<ImpressoraResponseDTO> listarTodos() {
        return impressoraService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImpressoraResponseDTO> buscarPorId(@PathVariable Long id) {
        ImpressoraResponseDTO impressora = impressoraService.buscarPorId(id);
        return ResponseEntity.ok(impressora);
    }

    @PostMapping
    public ResponseEntity<ImpressoraResponseDTO> salvar(@RequestBody ImpressoraRequestDTO dto) {
        ImpressoraResponseDTO salvo = impressoraService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        impressoraService.deletarPorId(id);
        return ResponseEntity.noContent().build();
    }
}
