package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.dto.HistoricoImpressaoRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.HistoricoImpressaoResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.HistoricoImpressaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historico")
@CrossOrigin(origins = "*")
public class HistoricoImpressaoController {

    @Autowired
    private HistoricoImpressaoService historicoService;

    @GetMapping
    public List<HistoricoImpressaoResponseDTO> listarTodos() {
        return historicoService.listarTodos();
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<HistoricoImpressaoResponseDTO> listarPorUsuario(@PathVariable Long usuarioId) {
        return historicoService.listarPorUsuario(usuarioId);
    }

    @GetMapping("/usuario-nome/{nome}")
    public List<HistoricoImpressaoResponseDTO> listarPorNomeUsuario(@PathVariable String nome) {
        return historicoService.listarPorNomeUsuario(nome);
    }

    @PostMapping
    public ResponseEntity<HistoricoImpressaoResponseDTO> salvar(@RequestBody HistoricoImpressaoRequestDTO dto) {
        HistoricoImpressaoResponseDTO salvo = historicoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
