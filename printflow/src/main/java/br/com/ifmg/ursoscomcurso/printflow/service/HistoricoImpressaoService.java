package br.com.ifmg.ursoscomcurso.printflow.service;

import br.com.ifmg.ursoscomcurso.printflow.domain.HistoricoImpressao;
import br.com.ifmg.ursoscomcurso.printflow.dto.HistoricoImpressaoRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.HistoricoImpressaoResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.repository.HistoricoImpressaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Service
public class HistoricoImpressaoService {

    @Autowired
    private HistoricoImpressaoRepository repository;

    public List<HistoricoImpressaoResponseDTO> listarTodos() {
        List<HistoricoImpressao> lista = repository.findAllOrdenado();
        if (lista.isEmpty()) {
            lista = popularHistoricoInicial();
        }
        return lista.stream().map(HistoricoImpressaoResponseDTO::fromEntity).toList();
    }

    public List<HistoricoImpressaoResponseDTO> listarPorUsuario(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId).stream()
                .map(HistoricoImpressaoResponseDTO::fromEntity)
                .toList();
    }

    public List<HistoricoImpressaoResponseDTO> listarPorNomeUsuario(String nome) {
        return repository.findByUsuarioNomeContainingIgnoreCase(nome).stream()
                .map(HistoricoImpressaoResponseDTO::fromEntity)
                .toList();
    }

    public HistoricoImpressaoResponseDTO salvar(HistoricoImpressaoRequestDTO dto) {
        HistoricoImpressao h = new HistoricoImpressao();
        h.setTrabalho_id(dto.trabalho_id());
        h.setModelo(dto.modelo());
        h.setResultado(dto.resultado() != null ? dto.resultado() : "Concluído");
        h.setImpressora_id(dto.impressora_id());
        h.setImpressora_nome(dto.impressora_nome());
        h.setUsuarioId(dto.usuario_id());
        h.setUsuarioNome(dto.usuario_nome());
        h.setMaterial(dto.material() != null ? dto.material() : "PLA");
        h.setCor(dto.cor() != null ? dto.cor() : "Preto");
        h.setPeso_gramas(dto.peso_gramas() != null ? dto.peso_gramas() : 30);
        h.setFinalizado_em(dto.finalizado_em() != null ? dto.finalizado_em() : new Timestamp(System.currentTimeMillis()));
        h.setTempo_real(dto.tempo_real() != null ? dto.tempo_real() : 45);

        HistoricoImpressao salvo = repository.save(h);
        return HistoricoImpressaoResponseDTO.fromEntity(salvo);
    }

    private List<HistoricoImpressao> popularHistoricoInicial() {
        long agora = System.currentTimeMillis();
        long hora = 3600000L;
        long dia = 86400000L;

        List<HistoricoImpressao> seeds = new ArrayList<>();

        seeds.add(new HistoricoImpressao(null, 101L, "Suporte_Motor_Nema17.gcode", "Concluído", 1L, "Bambu-X1", 1L, "m.santos", "PETG", "Preto", 42, new Timestamp(agora - (2 * hora)), 95));
        seeds.add(new HistoricoImpressao(null, 102L, "Gabinete_RaspberryPi4.stl", "Concluído", 2L, "Ender-V3", 2L, "Rafael M.", "PLA", "Azul", 28, new Timestamp(agora - (5 * hora)), 60));
        seeds.add(new HistoricoImpressao(null, 103L, "Braco_Robotico_Articulacao.gcode", "Concluído", 3L, "Prusa-MK4", 3L, "Prof. Silva", "ABS", "Laranja", 85, new Timestamp(agora - (1 * dia)), 180));
        seeds.add(new HistoricoImpressao(null, 104L, "Engrenagem_Dupla_Helicoidal.stl", "Falha", 1L, "Bambu-X1", 1L, "m.santos", "PLA", "Branco", 18, new Timestamp(agora - (1 * dia + 4 * hora)), 35));
        seeds.add(new HistoricoImpressao(null, 105L, "Vaso_Geometrico_Voronoi.gcode", "Concluído", 2L, "Ender-V3", 4L, "Mariana C.", "PLA", "Vermelho", 65, new Timestamp(agora - (2 * dia)), 140));
        seeds.add(new HistoricoImpressao(null, 106L, "Protetor_Cabos_Calha.stl", "Concluído", 3L, "Prusa-MK4", 5L, "Ana Lima", "PETG", "Cinza", 34, new Timestamp(agora - (3 * dia)), 75));
        seeds.add(new HistoricoImpressao(null, 107L, "Case_Bateria_18650_x4.gcode", "Cancelado", 2L, "Ender-V3", 2L, "Rafael M.", "ABS", "Preto", 12, new Timestamp(agora - (3 * dia + 6 * hora)), 20));
        seeds.add(new HistoricoImpressao(null, 108L, "Drone_Arm_Replacement_V2.gcode", "Concluído", 1L, "Bambu-X1", 1L, "m.santos", "PETG", "Verde", 55, new Timestamp(agora - (4 * dia)), 110));

        try {
            return repository.saveAll(seeds);
        } catch (Exception e) {
            return seeds;
        }
    }
}
