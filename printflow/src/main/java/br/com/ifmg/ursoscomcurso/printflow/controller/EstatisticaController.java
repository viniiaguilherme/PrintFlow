package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.repository.EspacoRepository;
import br.com.ifmg.ursoscomcurso.printflow.repository.ImpressoraRepository;
import br.com.ifmg.ursoscomcurso.printflow.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/estatisticas")
@CrossOrigin(origins = "*")
public class EstatisticaController {

    @Autowired
    private EspacoRepository espacoRepository;

    @Autowired
    private ImpressoraRepository impressoraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/geral")
    public ResponseEntity<Map<String, Object>> buscarEstatisticasGerais() {
        long espacosCount = espacoRepository.count();
        long impressorasCount = impressoraRepository.count();
        long usuariosCount = usuarioRepository.count();
        long impressoesTotais = 124; // Valor simulado de histórico de impressões

        Map<String, Object> response = Map.of(
            "espacos", espacosCount,
            "impressoras_cadastradas", impressorasCount,
            "usuarios_cadastrados", usuariosCount,
            "impressoes_totais", impressoesTotais
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/espaco/{espacoId}")
    public ResponseEntity<Map<String, Object>> buscarEstatisticasEspaco(@PathVariable Long espacoId) {
        long impressorasCount = impressoraRepository.count();
        long filasCount = 3;
        long alertasCount = 0;
        long usuariosCount = usuarioRepository.count();

        Map<String, Object> response = Map.of(
            "impressoras", impressorasCount,
            "filas", filasCount,
            "alertas", alertasCount,
            "usuarios", usuariosCount
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/usuarios")
    public ResponseEntity<Map<String, Object>> buscarEstatisticasUsuarios() {
        long totalMembros = usuarioRepository.count();
        long ativosAgora = totalMembros > 0 ? 1 : 0;
        long totalImpressoes = 111;
        double filamentoUsadoKg = 6.4;

        Map<String, Object> response = Map.of(
            "total_membros", totalMembros,
            "ativos_agora", ativosAgora,
            "total_impressoes", totalImpressoes,
            "filamento_usado_kg", filamentoUsadoKg
        );

        return ResponseEntity.ok(response);
    }
}
