package br.com.ifmg.ursoscomcurso.printflow.service;

import br.com.ifmg.ursoscomcurso.printflow.domain.Espaco;
import br.com.ifmg.ursoscomcurso.printflow.dto.EspacoRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.EspacoResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.exception.RecursoNaoEncontradoException;
import br.com.ifmg.ursoscomcurso.printflow.exception.RegraNegocioException;
import br.com.ifmg.ursoscomcurso.printflow.repository.EspacoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EspacoService {

    @Autowired
    private EspacoRepository espacoRepository;

    public List<EspacoResponseDTO> listarTodos() {
        return espacoRepository.findAll()
                .stream()
                .map(EspacoResponseDTO::fromEntity)
                .toList();
    }

    public EspacoResponseDTO buscarPorId(Long id) {
        return espacoRepository.findById(id)
                .map(EspacoResponseDTO::fromEntity)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espaço não encontrado com o ID: " + id));
    }

    public EspacoResponseDTO salvar(EspacoRequestDTO dto) {
        if (espacoRepository.findByNome(dto.nome()).isPresent()) {
            throw new RegraNegocioException("Espaço com este nome já cadastrado!");
        }

        Espaco espaco = new Espaco();
        espaco.setNome(dto.nome());
        espaco.setResponsavel(dto.responsavel());
        espaco.setStatus(dto.status());

        Espaco salvo = espacoRepository.save(espaco);
        return EspacoResponseDTO.fromEntity(salvo);
    }

    public void deletarPorId(Long id) {
        if (!espacoRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Espaço não encontrado com o ID: " + id);
        }
        espacoRepository.deleteById(id);
    }
}
