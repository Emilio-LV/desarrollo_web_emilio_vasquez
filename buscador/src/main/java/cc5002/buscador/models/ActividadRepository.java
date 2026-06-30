package cc5002.buscador.models;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Integer> {

    // Busca por nombre, descripción o comuna.
    @Query("SELECT a FROM Actividad a JOIN a.miembro m JOIN m.comuna c WHERE "
            + "LOWER(a.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(a.descripcion) LIKE LOWER(CONCAT('%', :q, '%')) OR "
            + "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Actividad> buscar(@Param("q") String q);

    // Filas de una misma actividad; la descripción se compara en el servicio.
    List<Actividad> findByMiembroIdAndNombreAndTipo(Integer miembroId, String nombre, String tipo);
}
