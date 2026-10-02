package br.com.ifmg.ursoscomcurso.printflow.config.security;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TokenBlacklistService {

    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    public void invalidarToken(String token) {
        blacklist.put(token, System.currentTimeMillis());
    }

    public boolean isInvalidado(String token) {
        return blacklist.containsKey(token);
    }
}
