CREATE TABLE IF NOT EXISTS parametros_maturidade (
  id tinyint NOT NULL,
  nome varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  descricao varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO parametros_maturidade (id, nome, descricao) VALUES
  (0, 'Inicial', 'Processos Imprevisiveis e pouco controlados'),
  (1, 'Gerenciado', 'Processos sao projetos, ainda reativos.'),
  (2, 'Definido', 'Processos sao conhecidos pela organizacao, documentos e proativos'),
  (3, 'Qualidade', 'Processos organziados e medidos'),
  (4, 'Otimizacao', 'Processos organizados, medidos e otimizados.')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  descricao = VALUES(descricao);

ALTER TABLE empresas
  ADD CONSTRAINT fk_empresas_parametro_maturidade
  FOREIGN KEY (parametro_maturidade) REFERENCES parametros_maturidade (id)
  ON UPDATE CASCADE ON DELETE RESTRICT;
