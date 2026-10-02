package br.com.ifmg.ursoscomcurso.printflow.controller;

import br.com.ifmg.ursoscomcurso.printflow.config.security.TokenService;
import br.com.ifmg.ursoscomcurso.printflow.domain.Usuario;
import br.com.ifmg.ursoscomcurso.printflow.dto.LoginRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.LoginResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.UsuarioRequestDTO;
import br.com.ifmg.ursoscomcurso.printflow.dto.UsuarioResponseDTO;
import br.com.ifmg.ursoscomcurso.printflow.service.UsuarioService;
import br.com.ifmg.ursoscomcurso.printflow.config.security.TokenBlacklistService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private TokenBlacklistService blacklistService;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        if (this.usuarioService.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = passwordEncoder.encode(req.senha());
        Usuario newUsuario = new Usuario(req.nome(), req.email(), encryptedPassword, req.role());
        this.usuarioService.save(newUsuario);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getAuthenticatedUser(@RequestHeader(value = "Authorization", required = false) String tokenBearer) {
        if (tokenBearer == null || !tokenBearer.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = tokenBearer.substring(7);
        if (blacklistService.isInvalidado(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String email = tokenService.validateToken(token);
        if (email == null || email.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            Usuario user = usuarioService.buscarEntityPorEmail(email);
            return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String tokenBearer) {
        if (tokenBearer != null && tokenBearer.startsWith("Bearer ")) {
            String token = tokenBearer.substring(7);
            blacklistService.invalidarToken(token);
        }
        return ResponseEntity.noContent().build();
    }
}


