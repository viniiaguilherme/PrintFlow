package br.com.ifmg.ursoscomcurso.printflow.repository;

import br.com.ifmg.ursoscomcurso.printflow.domain.Alerta;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {
    List<Alerta> findByVisualizadoFalse(Sort sort);
}
