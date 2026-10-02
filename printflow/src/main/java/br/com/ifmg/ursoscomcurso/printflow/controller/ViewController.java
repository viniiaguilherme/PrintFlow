package br.com.ifmg.ursoscomcurso.printflow.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping({"/", "/index", "/index.html"})
    public String index() {
        return "telasS/index";
    }

    @GetMapping({"/login", "/login.html"})
    public String login() {
        return "telasS/login";
    }

    @GetMapping({"/cadastro", "/cadastro.html"})
    public String cadastro() {
        return "telasS/cadastro";
    }

    @GetMapping({"/dashboard", "/dashboard.html"})
    public String dashboard() {
        return "telasS/dashboard";
    }

    @GetMapping({"/impressoras", "/impressoras.html"})
    public String impressoras() {
        return "telasS/impressoras";
    }

    @GetMapping({"/usuarios", "/usuarios.html"})
    public String usuarios() {
        return "telasS/usuarios";
    }

    @GetMapping({"/espacos", "/espacos.html"})
    public String espacos() {
        return "telasS/espacos";
    }

    @GetMapping({"/fila", "/fila.html"})
    public String fila() {
        return "telasS/fila";
    }

    @GetMapping({"/configuracoes", "/configuracoes.html"})
    public String configuracoes() {
        return "telasS/configuracoes";
    }

    @GetMapping({"/perfil", "/perfil.html"})
    public String perfil() {
        return "telasS/perfil";
    }

    @GetMapping({"/alerta", "/alerta.html"})
    public String alerta() {
        return "telasS/alerta";
    }
}
