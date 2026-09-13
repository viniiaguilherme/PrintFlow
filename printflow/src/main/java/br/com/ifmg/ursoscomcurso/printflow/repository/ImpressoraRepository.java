package br.com.ifmg.ursoscomcurso.printflow.repository;

import br.com.ifmg.ursoscomcurso.printflow.domain.Impressora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImpressoraRepository extends JpaRepository<Impressora, Long> {
    Optional<Impressora> findByNome(String nome);
}
