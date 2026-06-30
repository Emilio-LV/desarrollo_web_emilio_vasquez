package cc5002.buscador.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cc5002.buscador.services.BuscadorService;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final BuscadorService buscadorService;

    public ApiController(BuscadorService buscadorService) {
        this.buscadorService = buscadorService;
    }

    @GetMapping("/buscar")
    public Map<String, Object> buscar(@RequestParam("q") String q) {
        if (q == null || q.trim().length() < 3) {
            return Map.of("data", List.of());
        }
        return Map.of("data", buscadorService.buscar(q.trim()));
    }

    @PostMapping("/actividades/{id}/nota")
    public ResponseEntity<Map<String, Object>> agregarNota(@PathVariable("id") Integer id,
                                                           @RequestParam("nota") Integer nota) {
        if (nota == null || nota < 1 || nota > 7) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La nota debe ser un número entero entre 1 y 7."));
        }
        try {
            return ResponseEntity.ok(buscadorService.agregarNota(id, nota));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
