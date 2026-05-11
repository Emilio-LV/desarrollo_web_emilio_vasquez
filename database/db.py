from datetime import datetime

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.mysql import SET as MySQLSet
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, joinedload


DB_NAME = "tarea2"
DB_USERNAME = "cc5002"
DB_PASSWORD = "programacionweb"
DB_HOST = "localhost"
DB_PORT = 3306

DATABASE_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# --- Modelos ---

class Region(Base):
    __tablename__ = 'region'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)

    comunas = relationship("Comuna", back_populates="region")


class Comuna(Base):
    __tablename__ = 'comuna'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    region_id = Column(Integer, ForeignKey('region.id'), nullable=False)

    region = relationship("Region", back_populates="comunas")
    miembros = relationship("Miembro", back_populates="comuna")


class Miembro(Base):
    __tablename__ = 'miembro'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(80), nullable=False)
    telefono = Column(String(15), nullable=False)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.now)
    comuna_id = Column(Integer, ForeignKey('comuna.id'), nullable=False)

    # Tipo de miembro y campos condicionales (extensión propia, ver README)
    tipo = Column(Enum('pregrado', 'postgrado', 'funcionario', 'academico'), nullable=False)
    anio_ingreso = Column(Integer, nullable=True)
    programa = Column(Enum('magister', 'doctorado'), nullable=True)
    area_investigacion = Column(String(200), nullable=True)
    cargo = Column(String(200), nullable=True)
    unidad = Column(String(200), nullable=True)
    departamento = Column(String(200), nullable=True)
    especialidad = Column(String(200), nullable=True)

    comuna = relationship("Comuna", back_populates="miembros")
    actividades = relationship("Actividad", back_populates="miembro", cascade="all, delete")


class Actividad(Base):
    __tablename__ = 'actividad'

    id = Column(Integer, primary_key=True, autoincrement=True)
    miembro_id = Column(Integer, ForeignKey('miembro.id'), nullable=False)
    # SET en vez de ENUM para guardar varios días en una fila (ver README)
    dia = Column(
        MySQLSet('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'),
        nullable=False,
    )
    hora_inicio = Column(String(5), nullable=False)
    duracion = Column(String(5), nullable=False)
    tipo = Column(
        Enum('arte', 'deporte', 'tecnología', 'social', 'recreación', 'otra'),
        nullable=False,
    )
    nombre = Column(String(45), nullable=False)
    descripcion = Column(Text, nullable=True)
    enlace = Column(String(500), nullable=False)

    miembro = relationship("Miembro", back_populates="actividades")
    fotos = relationship("Foto", back_populates="actividad", cascade="all, delete")

    @property
    def dias_ordenados(self):
        # Devuelve los días del SET en orden cronológico (lunes a domingo).
        orden = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        dias_set = self.dia or set()
        return [d for d in orden if d in dias_set]


class Foto(Base):
    __tablename__ = 'foto'

    id = Column(Integer, primary_key=True, autoincrement=True)
    ruta_archivo = Column(String(300), nullable=False)
    nombre_archivo = Column(String(300), nullable=False)
    actividad_id = Column(Integer, ForeignKey('actividad.id'), nullable=False)

    actividad = relationship("Actividad", back_populates="fotos")


# --- Funciones de acceso a la BD ---

def get_ultimos_miembros(n=5):
    """Últimos n miembros, más reciente primero, con su comuna pre-cargada."""
    session = SessionLocal()
    miembros = (
        session.query(Miembro)
        .options(joinedload(Miembro.comuna))
        .order_by(Miembro.fecha_registro.desc())
        .limit(n)
        .all()
    )
    session.close()
    return miembros


def get_regiones_con_comunas():
    """Lista de regiones (cada una con su lista de comunas) en formato de dicts.
    Se devuelve como dict para que el template pueda serializarlo a JSON."""
    session = SessionLocal()
    regiones = (
        session.query(Region)
        .options(joinedload(Region.comunas))
        .order_by(Region.id)
        .all()
    )
    result = [
        {
            "id": r.id,
            "nombre": r.nombre,
            "comunas": [
                {"id": c.id, "nombre": c.nombre}
                for c in sorted(r.comunas, key=lambda c: c.nombre)
            ],
        }
        for r in regiones
    ]
    session.close()
    return result


def get_comunas_por_region():
    """Dict {comuna_id: region_id} con todas las comunas. Lo usa la validación
    servidor para chequear que una comuna existe y pertenece a la región elegida."""
    session = SessionLocal()
    comunas = session.query(Comuna).all()
    result = {c.id: c.region_id for c in comunas}
    session.close()
    return result


def get_miembros_paginados(pagina, por_pagina):
    """Devuelve (miembros_de_la_pagina, total_en_la_bd) ordenados por fecha DESC."""
    session = SessionLocal()
    total = session.query(Miembro).count()
    miembros = (
        session.query(Miembro)
        .options(joinedload(Miembro.comuna))
        .order_by(Miembro.fecha_registro.desc())
        .limit(por_pagina)
        .offset((pagina - 1) * por_pagina)
        .all()
    )
    session.close()
    return miembros, total


def get_miembro_con_actividades(miembro_id):
    """Miembro con comuna, región, actividades y fotos cargadas. None si no existe."""
    session = SessionLocal()
    miembro = (
        session.query(Miembro)
        .options(
            joinedload(Miembro.comuna).joinedload(Comuna.region),
            joinedload(Miembro.actividades).joinedload(Actividad.fotos),
        )
        .filter(Miembro.id == miembro_id)
        .first()
    )
    session.close()
    return miembro


def crear_miembro_con_actividades(datos_miembro, lista_actividades):
    """Inserta un miembro junto con sus actividades y fotos en una sola transacción.
    Las relationships con cascade hacen que session.add(miembro) propague los inserts.

    lista_actividades es una lista de {"datos": kwargs_actividad, "fotos": [kwargs_foto, ...]}.
    """
    session = SessionLocal()

    miembro = Miembro(**datos_miembro)
    for ad in lista_actividades:
        actividad = Actividad(**ad["datos"])
        for fd in ad["fotos"]:
            actividad.fotos.append(Foto(**fd))
        miembro.actividades.append(actividad)

    session.add(miembro)
    session.commit()
    miembro_id = miembro.id
    session.close()
    return miembro_id
