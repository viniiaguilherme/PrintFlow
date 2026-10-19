package br.com.ifmg.ursoscomcurso.printflow.service;

import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;
import br.com.ifmg.ursoscomcurso.printflow.dto.UsuarioRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.UsuarioResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.exception.RecursoNaoEncontradoException;
import br.com.ifmg.ursoscomcurso.printflow.exception.RegraNegocioException;
import br.com.ifmg.ursoscomcurso.printflow.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioResponseDTO::fromEntity)
                .toList();
    }

    public UsuarioResponseDTO buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .map(UsuarioResponseDTO::fromEntity)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com o ID: " + id));
    }

    public boolean existsByEmail(String email) {
        return usuarioRepository.findByEmail(email).isPresent();
    }

    public Usuario buscarEntityPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com o email: " + email));
    }

    public UsuarioResponseDTO findByEmail(String email) {
        return UsuarioResponseDTO.fromEntity(buscarEntityPorEmail(email));
    }

    public UsuarioResponseDTO buscarPorEmail(String email) {
        return findByEmail(email);
    }

    public Usuario save(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    public UsuarioResponseDTO salvar(UsuarioRequestDTO dto) {
        if (usuarioRepository.findByEmail(dto.email()).isPresent()) {
            throw new RegraNegocioException("E-mail já cadastrado!");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setRole(dto.role());
        usuario.setSenha(passwordEncoder.encode(dto.senha()));

        Usuario salvo = usuarioRepository.save(usuario);
        return UsuarioResponseDTO.fromEntity(salvo);
    }

    public UsuarioResponseDTO atualizar(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com o ID: " + id));

        java.util.Optional<Usuario> outroComEmail = usuarioRepository.findByEmail(dto.email());
        if (outroComEmail.isPresent() && !outroComEmail.get().getId().equals(id)) {
            throw new RegraNegocioException("E-mail já cadastrado por outro usuário!");
        }

        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        if (dto.role() != null) {
            usuario.setRole(dto.role());
        }
        if (dto.senha() != null && !dto.senha().trim().isEmpty()) {
            usuario.setSenha(passwordEncoder.encode(dto.senha()));
        }

        Usuario atualizado = usuarioRepository.save(usuario);
        return UsuarioResponseDTO.fromEntity(atualizado);
    }

    public void deletarPorId(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Usuário não encontrado com o ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }
}

