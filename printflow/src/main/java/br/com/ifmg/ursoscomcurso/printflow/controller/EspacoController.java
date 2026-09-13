package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.dto.EspacoRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.EspacoResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.EspacoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/espaco")
@CrossOrigin(origins = "*")
public class EspacoController {

    @Autowired
    private EspacoService espacoService;

    @GetMapping
    public List<EspacoResponseDTO> listarTodos() {
        return espacoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EspacoResponseDTO> buscarPorId(@PathVariable Long id) {
        EspacoResponseDTO espaco = espacoService.buscarPorId(id);
        return ResponseEntity.ok(espaco);
    }

    @PostMapping
    public ResponseEntity<EspacoResponseDTO> salvar(@RequestBody EspacoRequestDTO dto) {
        EspacoResponseDTO salvo = espacoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        espacoService.deletarPorId(id);
        return ResponseEntity.noContent().build();
    }
}
