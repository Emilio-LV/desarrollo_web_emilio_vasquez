package cc5002.buscador.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer nota;

    @ManyToOne
    @JoinColumn(name = "actividad_id")
    private Actividad actividad;

    public Nota() {
    }

    public Nota(Actividad actividad, Integer nota) {
        this.actividad = actividad;
        this.nota = nota;
    }

    public Integer getId() {
        return id;
    }

    public Integer getNota() {
        return nota;
    }

    public Actividad getActividad() {
        return actividad;
    }
}
