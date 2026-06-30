package cc5002.buscador;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

// Test mínimo: no levanta el contexto, así "mvn package" no necesita la BD.
class BuscadorApplicationTests {

    @Test
    void sanity() {
        assertTrue(true);
    }
}
