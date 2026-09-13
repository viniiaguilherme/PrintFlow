package br.com.ifmg.ursoscomcurso.printflow.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "telasS/index";
    }

    @GetMapping("/login")
    public String login() {
        return "telasS/login";
    }

    @GetMapping("/cadastro")
    public String cadastro() {
        return "telasS/cadastro";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "telasS/dashboard";
    }

    @GetMapping("/impressoras")
    public String impressoras() {
        return "telasS/impressoras";
    }

    @GetMapping("/usuarios")
    public String usuarios() {
        return "telasS/usuarios";
    }

    @GetMapping("/espacos")
    public String espacos() {
        return "telasS/espacos";
    }

    @GetMapping("/fila")
    public String fila() {
        return "telasS/fila";
    }

    @GetMapping("/configuracoes")
    public String configuracoes() {
        return "telasS/configuracoes";
    }
}
