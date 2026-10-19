package br.com.ifmg.ursoscomcurso.printflow.repository;

import br.com.ifmg.ursoscomcurso.printflow.domain.HistoricoImpressao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoImpressaoRepository extends JpaRepository<HistoricoImpressao, Long> {
    List<HistoricoImpressao> findByUsuarioId(Long usuarioId);
    List<HistoricoImpressao> findByUsuarioNomeContainingIgnoreCase(String usuarioNome);

    @Query("SELECT h FROM HistoricoImpressao h ORDER BY h.id DESC")
    List<HistoricoImpressao> findAllOrdenado();
}
