SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema tarea2
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `tarea2` ;

-- -----------------------------------------------------
-- Schema tarea2
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tarea2` DEFAULT CHARACTER SET utf8 ;
USE `tarea2` ;

-- -----------------------------------------------------
-- Table `tarea2`.`region`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tarea2`.`region` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tarea2`.`comuna`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tarea2`.`comuna` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(200) NOT NULL,
  `region_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_comuna_region1_idx` (`region_id` ASC),
  CONSTRAINT `fk_comuna_region1`
    FOREIGN KEY (`region_id`)
    REFERENCES `tarea2`.`region` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tarea2`.`miembro`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tarea2`.`miembro` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(80) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `fecha_registro` DATETIME NOT NULL,
  `comuna_id` INT NOT NULL,
  -- Tipo de miembro y campos condicionales (decisión propia: ver README)
  `tipo` ENUM('pregrado', 'postgrado', 'funcionario', 'academico') NOT NULL,
  `anio_ingreso` INT NULL,
  `programa` ENUM('magister', 'doctorado') NULL,
  `area_investigacion` VARCHAR(200) NULL,
  `cargo` VARCHAR(200) NULL,
  `unidad` VARCHAR(200) NULL,
  `departamento` VARCHAR(200) NULL,
  `especialidad` VARCHAR(200) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_miembro_comuna1_idx` (`comuna_id` ASC),
  CONSTRAINT `fk_miembro_comuna1`
    FOREIGN KEY (`comuna_id`)
    REFERENCES `tarea2`.`comuna` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tarea2`.`actividad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tarea2`.`actividad` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `miembro_id` INT NOT NULL,
  -- Cambio ENUM -> SET para permitir múltiples días en una sola fila (ver README)
  `dia` SET('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo') NOT NULL,
  `hora_inicio` VARCHAR(5) NOT NULL,
  `duracion` VARCHAR(5) NOT NULL,
  `tipo` ENUM('arte', 'deporte', 'tecnología', 'social', 'recreación', 'otra') NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` TEXT(500) NULL,
  -- Enlace a contenido propio de la actividad (decisión propia: ver README)
  `enlace` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_actividad_miembro1_idx` (`miembro_id` ASC),
  CONSTRAINT `fk_actividad_miembro1`
    FOREIGN KEY (`miembro_id`)
    REFERENCES `tarea2`.`miembro` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tarea2`.`foto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tarea2`.`foto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ruta_archivo` VARCHAR(300) NOT NULL,
  `nombre_archivo` VARCHAR(300) NOT NULL,
  `actividad_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_foto_actividad1_idx` (`actividad_id` ASC),
  CONSTRAINT `fk_foto_actividad1`
    FOREIGN KEY (`actividad_id`)
    REFERENCES `tarea2`.`actividad` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;



-- Para cachar que funcione

USE tarea2;
SELECT COUNT(*) FROM region;
SELECT COUNT(*) FROM comuna;

DESCRIBE miembro;
DESCRIBE actividad;

USE tarea2;
SELECT COUNT(*) AS total, MAX(fecha_registro) AS mas_reciente FROM miembro;
SELECT id, nombre, email, fecha_registro FROM miembro ORDER BY fecha_registro DESC LIMIT 5;