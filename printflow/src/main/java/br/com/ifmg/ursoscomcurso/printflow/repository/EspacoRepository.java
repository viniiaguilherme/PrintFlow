package br.com.ifmg.ursoscomcurso.printflow.repository;

import br.com.ifmg.ursoscomcurso.printflow.domain.Espaco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EspacoRepository extends JpaRepository<Espaco, Long> {
    Optional<Espaco> findByNome(String nome);
}
