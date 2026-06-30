package cc5002.buscador.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "actividad")
public class Actividad {

    @Id
    private Integer id;
    private String dia; // SET de MySQL, se lee como "lunes,martes"
    private String tipo;
    private String nombre;
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "miembro_id")
    private Miembro miembro;

    public Integer getId() {
        return id;
    }

    public String getDia() {
        return dia;
    }

    public String getTipo() {
        return tipo;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public Miembro getMiembro() {
        return miembro;
    }
}
