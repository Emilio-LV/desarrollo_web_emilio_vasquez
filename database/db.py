from datetime import datetime

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Enum, ForeignKey, func
from sqlalchemy.dialects.mysql import SET as MySQLSet, TIMESTAMP as MySQLTimestamp
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
    comentarios = relationship("Comentario", back_populates="actividad", cascade="all, delete")

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


class Comentario(Base):
    """Comentarios de actividades (tabla nueva de la Tarea 3)."""
    __tablename__ = 'comentario'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(80), nullable=False)
    texto = Column(String(300), nullable=False)
    fecha = Column(MySQLTimestamp, nullable=False, default=datetime.now)
    actividad_id = Column(Integer, ForeignKey('actividad.id'), nullable=False)

    actividad = relationship("Actividad", back_populates="comentarios")


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


# --- Funciones agregadas en Tarea 3: comentarios y estadísticas ---

def actividad_existe(actividad_id):
    """True si existe una actividad con ese id."""
    session = SessionLocal()
    existe = session.query(Actividad.id).filter(Actividad.id == actividad_id).first() is not None
    session.close()
    return existe


def crear_comentario(actividad_id, nombre, texto):
    """Inserta un comentario y lo devuelve como dict para responderlo al cliente."""
    session = SessionLocal()
    c = Comentario(
        actividad_id=actividad_id,
        nombre=nombre,
        texto=texto,
        fecha=datetime.now(),
    )
    session.add(c)
    session.commit()
    data = {
        "id": c.id,
        "nombre": c.nombre,
        "texto": c.texto,
        "fecha": c.fecha.strftime("%d-%m-%Y %H:%M"),
        "actividad_id": c.actividad_id,
    }
    session.close()
    return data


def get_comentarios_por_actividad(actividad_id):
    """Comentarios de una actividad, en orden cronológico."""
    session = SessionLocal()
    coms = (
        session.query(Comentario)
        .filter(Comentario.actividad_id == actividad_id)
        .order_by(Comentario.fecha.asc(), Comentario.id.asc())
        .all()
    )
    result = [
        {
            "id": c.id,
            "nombre": c.nombre,
            "texto": c.texto,
            "fecha": c.fecha.strftime("%d-%m-%Y %H:%M"),
            "actividad_id": c.actividad_id,
        }
        for c in coms
    ]
    session.close()
    return result


def get_comentarios_de_actividades(actividad_ids):
    """Comentarios de varias actividades a la vez, en orden cronológico."""
    if not actividad_ids:
        return []
    session = SessionLocal()
    coms = (
        session.query(Comentario)
        .filter(Comentario.actividad_id.in_(list(actividad_ids)))
        .order_by(Comentario.fecha.asc(), Comentario.id.asc())
        .all()
    )
    result = [
        {
            "id": c.id,
            "nombre": c.nombre,
            "texto": c.texto,
            "fecha": c.fecha.strftime("%d-%m-%Y %H:%M"),
            "actividad_id": c.actividad_id,
        }
        for c in coms
    ]
    session.close()
    return result


def get_miembros_por_dia():
    """Miembros registrados por día para el gráfico de líneas.
    Los días sin registros se rellenan con 0 para que la línea no salte fechas."""
    session = SessionLocal()
    filas = (
        session.query(
            func.date(Miembro.fecha_registro).label("fecha"),
            func.count(Miembro.id).label("total"),
        )
        .group_by(func.date(Miembro.fecha_registro))
        .order_by(func.date(Miembro.fecha_registro).asc())
        .all()
    )
    session.close()

    if not filas:
        return []

    # Rellenar días sin registros con 0 entre la primera y última fecha vista.
    por_fecha = {str(f.fecha): int(f.total) for f in filas}
    fechas_ordenadas = sorted(por_fecha.keys())
    inicio = datetime.strptime(fechas_ordenadas[0], "%Y-%m-%d").date()
    fin = datetime.strptime(fechas_ordenadas[-1], "%Y-%m-%d").date()

    result = []
    actual = inicio
    while actual <= fin:
        clave = actual.strftime("%Y-%m-%d")
        result.append({"fecha": clave, "total": por_fecha.get(clave, 0)})
        actual = actual.fromordinal(actual.toordinal() + 1)
    return result


def get_actividades_por_tipo():
    """[{tipo: '...', total: N}] para el gráfico de torta."""
    session = SessionLocal()
    filas = (
        session.query(Actividad.tipo, func.count(Actividad.id).label("total"))
        .group_by(Actividad.tipo)
        .order_by(func.count(Actividad.id).desc())
        .all()
    )
    session.close()
    return [{"tipo": tipo, "total": int(total)} for tipo, total in filas]


def get_actividades_por_comuna():
    """Total de actividades por comuna (solo comunas con miembros registrados)."""
    session = SessionLocal()
    filas = (
        session.query(Comuna.nombre, func.count(Actividad.id).label("total"))
        .join(Miembro, Miembro.comuna_id == Comuna.id)
        .join(Actividad, Actividad.miembro_id == Miembro.id)
        .group_by(Comuna.id, Comuna.nombre)
        .order_by(func.count(Actividad.id).desc())
        .all()
    )
    session.close()
    return [{"comuna": nombre, "total": int(total)} for nombre, total in filas]
