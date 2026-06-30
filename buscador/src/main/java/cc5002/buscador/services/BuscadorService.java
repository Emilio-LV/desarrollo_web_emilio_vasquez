package cc5002.buscador.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import cc5002.buscador.models.Actividad;
import cc5002.buscador.models.ActividadRepository;
import cc5002.buscador.models.Nota;
import cc5002.buscador.models.NotaRepository;

@Service
public class BuscadorService {

    private static final List<String> ORDEN_DIAS = Arrays.asList(
        "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo");

    private final ActividadRepository actividadRepository;
    private final NotaRepository notaRepository;

    public BuscadorService(ActividadRepository actividadRepository, NotaRepository notaRepository) {
        this.actividadRepository = actividadRepository;
        this.notaRepository = notaRepository;
    }

    // Agrupa las filas de una misma actividad (varios días) en un solo resultado.
    public List<Map<String, Object>> buscar(String q) {
        List<Actividad> actividades = actividadRepository.buscar(q);

        Map<String, List<Actividad>> grupos = new LinkedHashMap<>();
        for (Actividad a : actividades) {
            grupos.computeIfAbsent(claveGrupo(a), k -> new ArrayList<>()).add(a);
        }

        List<Map<String, Object>> resultados = new ArrayList<>();
        for (List<Actividad> grupo : grupos.values()) {
            resultados.add(filaDeGrupo(grupo));
        }
        return resultados;
    }

    // Agrega la nota y devuelve el promedio y contador de toda la actividad.
    public Map<String, Object> agregarNota(Integer actividadId, Integer valor) {
        Actividad actividad = actividadRepository.findById(actividadId)
                .orElseThrow(() -> new IllegalArgumentException("La actividad no existe."));

        notaRepository.save(new Nota(actividad, valor));

        return resumenNotas(filasDelGrupo(actividad));
    }

    private Map<String, Object> filaDeGrupo(List<Actividad> grupo) {
        Actividad primera = grupo.get(0);

        Map<String, Object> fila = new LinkedHashMap<>();
        fila.put("actividad_id", idRepresentante(grupo));
        fila.put("miembro", primera.getMiembro().getNombre());
        fila.put("dia", diasDelGrupo(grupo));
        fila.put("tipo", primera.getTipo());
        fila.put("comuna", primera.getMiembro().getComuna().getNombre());
        fila.put("nombre", primera.getNombre());
        fila.put("descripcion", primera.getDescripcion());

        Map<String, Object> notas = resumenNotas(grupo);
        fila.put("nota", notas.get("nota"));
        fila.put("num_notas", notas.get("num_notas"));
        return fila;
    }

    private List<Actividad> filasDelGrupo(Actividad actividad) {
        List<Actividad> candidatas = actividadRepository.findByMiembroIdAndNombreAndTipo(
            actividad.getMiembro().getId(), actividad.getNombre(), actividad.getTipo());

        List<Actividad> grupo = new ArrayList<>();
        for (Actividad a : candidatas) {
            if (mismoTexto(a.getDescripcion(), actividad.getDescripcion())) {
                grupo.add(a);
            }
        }
        return grupo;
    }

    private Map<String, Object> resumenNotas(List<Actividad> grupo) {
        List<Integer> ids = new ArrayList<>();
        for (Actividad a : grupo) {
            ids.add(a.getId());
        }
        List<Nota> notas = notaRepository.findByActividadIdIn(ids);

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("nota", promedio(notas));
        resumen.put("num_notas", notas.size());
        return resumen;
    }

    private Double promedio(List<Nota> notas) {
        if (notas.isEmpty()) {
            return null;
        }
        double suma = 0;
        for (Nota n : notas) {
            suma += n.getNota();
        }
        return Math.round((suma / notas.size()) * 10.0) / 10.0;
    }

    private Integer idRepresentante(List<Actividad> grupo) {
        Integer min = grupo.get(0).getId();
        for (Actividad a : grupo) {
            if (a.getId() < min) {
                min = a.getId();
            }
        }
        return min;
    }

    private String diasDelGrupo(List<Actividad> grupo) {
        List<String> presentes = new ArrayList<>();
        for (Actividad a : grupo) {
            if (a.getDia() == null) {
                continue;
            }
            for (String d : a.getDia().split(",")) {
                String dia = d.trim();
                if (!dia.isEmpty() && !presentes.contains(dia)) {
                    presentes.add(dia);
                }
            }
        }

        List<String> ordenados = new ArrayList<>();
        for (String dia : ORDEN_DIAS) {
            if (presentes.contains(dia)) {
                ordenados.add(dia);
            }
        }
        for (String dia : presentes) {
            if (!ordenados.contains(dia)) {
                ordenados.add(dia);
            }
        }
        return String.join(",", ordenados);
    }

    private String claveGrupo(Actividad a) {
        return a.getMiembro().getId() + "||" + a.getNombre() + "||" + a.getTipo()
                + "||" + (a.getDescripcion() == null ? "" : a.getDescripcion());
    }

    private boolean mismoTexto(String x, String y) {
        return (x == null) ? (y == null) : x.equals(y);
    }
}
