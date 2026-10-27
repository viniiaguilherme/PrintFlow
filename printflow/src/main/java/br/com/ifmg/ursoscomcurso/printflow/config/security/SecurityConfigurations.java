package br.com.ifmg.ursoscomcurso.printflow.config.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // 1. Rotas públicas (estáticos, auth e views de templates HTML)
                        .requestMatchers("/", "/index", "/index.html", "/login", "/login.html").permitAll()
                        .requestMatchers("/printflow/auth/login", "/auth/login").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/web/**", "/style.css", "/script.js", "/*.html", "/*.css", "/*.js", "/telasS/**").permitAll()
                        // Views HTML permitidas para que o JS da página possa ler o token do localStorage e redirecionar se não autenticado
                        .requestMatchers("/dashboard", "/dashboard.html", "/impressoras", "/impressoras.html", "/espacos", "/espacos.html", "/fila", "/fila.html", "/perfil", "/perfil.html", "/historico", "/historico.html").permitAll()

                        // 2. Permissões de APIs REST autenticadas (Apenas MAKER e OPERADOR)
                        .requestMatchers(HttpMethod.GET, "/espaco", "/espaco/**").hasAnyRole("MAKER", "OPERADOR")
                        .requestMatchers(HttpMethod.POST, "/espaco", "/espaco/**").hasRole("OPERADOR")
                        .requestMatchers(HttpMethod.PUT, "/espaco", "/espaco/**").hasRole("OPERADOR")
                        .requestMatchers(HttpMethod.DELETE, "/espaco", "/espaco/**").hasRole("OPERADOR")

                        .requestMatchers(HttpMethod.GET, "/impressora", "/impressora/**").hasAnyRole("MAKER", "OPERADOR")
                        .requestMatchers(HttpMethod.POST, "/impressora", "/impressora/**").hasRole("OPERADOR")
                        .requestMatchers(HttpMethod.PUT, "/impressora", "/impressora/**").hasRole("OPERADOR")
                        .requestMatchers(HttpMethod.DELETE, "/impressora", "/impressora/**").hasRole("OPERADOR")

                        .requestMatchers("/usuario", "/usuario/**").hasRole("OPERADOR")

                        .requestMatchers("/api/historico/**").hasAnyRole("MAKER", "OPERADOR")

                        // Qualquer outra requisição de API exige autenticação
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}

