-- Crear usuario
CREATE USER 'cc5002'@'localhost' IDENTIFIED BY 'programacionweb';

-- Darle permisos sobre la base tarea2
GRANT ALL ON tarea2.* TO 'cc5002'@'localhost';
