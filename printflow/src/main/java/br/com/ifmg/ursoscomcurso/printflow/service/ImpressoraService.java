package br.com.ifmg.ursoscomcurso.printflow.service;

import br.com.ifmg.ursoscomcurso.printflow.domain.Impressora;
import br.com.ifmg.ursoscomcurso.printflow.dto.ImpressoraRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.ImpressoraResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.exception.RecursoNaoEncontradoException;
import br.com.ifmg.ursoscomcurso.printflow.exception.RegraNegocioException;
import br.com.ifmg.ursoscomcurso.printflow.repository.ImpressoraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ImpressoraService {

    @Autowired
    private ImpressoraRepository impressoraRepository;

    public List<ImpressoraResponseDTO> listarTodos() {
        return impressoraRepository.findAll()
                .stream()
                .map(ImpressoraResponseDTO::fromEntity)
                .toList();
    }

    public ImpressoraResponseDTO buscarPorId(Long id) {
        return impressoraRepository.findById(id)
                .map(ImpressoraResponseDTO::fromEntity)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Impressora não encontrada com o ID: " + id));
    }

    public ImpressoraResponseDTO salvar(ImpressoraRequestDTO dto) {
        if (impressoraRepository.findByNome(dto.nome()).isPresent()) {
            throw new RegraNegocioException("Impressora com este nome já cadastrada!");
        }

        Impressora impressora = new Impressora();
        impressora.setNome(dto.nome());
        impressora.setModelo(dto.modelo());
        impressora.setMaterial_padrao(dto.material_padrao());
        impressora.setStatus(dto.status());

        Impressora salvo = impressoraRepository.save(impressora);
        return ImpressoraResponseDTO.fromEntity(salvo);
    }

    public void deletarPorId(Long id) {
        if (!impressoraRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Impressora não encontrada com o ID: " + id);
        }
        impressoraRepository.deleteById(id);
    }
}
