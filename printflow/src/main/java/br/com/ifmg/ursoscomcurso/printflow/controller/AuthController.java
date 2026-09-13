package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.config.security.TokenService;
import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;
import br.com.ifmg.ursoscomcurso.printflow.dto.LoginRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.LoginResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.UsuarioRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.UsuarioService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/printflow/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO req, HttpServletResponse response) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(req.email(), req.senha());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var user = (Usuario) auth.getPrincipal();
        var token = tokenService.generateToken(user);

        response.addHeader("Authorization", "Bearer " + token);
        return ResponseEntity.ok(LoginResponseDTO.fromEntity(user, token));
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid UsuarioRequestDTO req) {
        if (this.usuarioService.findByEmail(req.email()) != null) {
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = new BCryptPasswordEncoder().encode(req.senha());
        Usuario newUsuario = new Usuario(req.nome(), req.email(), encryptedPassword, req.role());
        this.usuarioService.save(newUsuario);
        return ResponseEntity.ok().build();
    }
}
