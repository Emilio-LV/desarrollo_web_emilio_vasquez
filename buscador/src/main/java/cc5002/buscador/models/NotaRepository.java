package cc5002.buscador.models;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Integer> {

    List<Nota> findByActividadIdIn(List<Integer> actividadIds);
}
