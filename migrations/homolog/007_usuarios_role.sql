-- Role do usuario (homologacao)

ALTER TABLE usuarios
  ADD COLUMN role enum('GESTOR','COLABORADOR','USUARIO_TAREFA') NOT NULL DEFAULT 'COLABORADOR';
