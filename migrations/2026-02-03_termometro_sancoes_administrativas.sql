START TRANSACTION;

CREATE TABLE IF NOT EXISTS termometro_sancoes_administrativas (
  id tinyint NOT NULL,
  nome varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  sancao varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  descricao varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO termometro_sancoes_administrativas (id, nome, sancao, descricao) VALUES
  (0, 'Baixo impacto', 'Advertencia', 'A ANPD notifica a empresa e estabelece prazo para correção da irregularidade, sem multa financeira.'),
  (1, 'Medio impacto', 'Multa diaria', 'Multa aplicada por dia de descumprimento, limitada ao teto legal, enquanto a irregularidade persistir.'),
  (2, 'Alto impacto', 'Multa simples', 'Até 2% do faturamento da empresa no Brasil, limitada a R$ 50 milhões por infração.'),
  (3, 'Muito alto impacto', 'Publicizacao da infracao', 'Obrigação de divulgar publicamente a infração cometida, gerando dano reputacional relevante.'),
  (4, 'Critico', 'Bloqueio ou eliminacao dos dados pessoais', 'Impedimento temporário do uso dos dados ou exclusão definitiva dos dados relacionados à infração.'),
  (5, 'Extremo', 'Suspensao parcial do funcionamento do banco de dados', 'Parte relevante das operações de dados da empresa fica proibida de operar.'),
  (6, 'Maximo impacto', 'Suspensao ou proibicao total do tratamento de dados pessoais', 'A empresa fica legalmente impedida de tratar dados pessoais, podendo inviabilizar o negócio.')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  sancao = VALUES(sancao),
  descricao = VALUES(descricao);

ALTER TABLE empresas
  ADD COLUMN termometro_sancoes_id tinyint NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_empresas_termometro_sancoes
  FOREIGN KEY (termometro_sancoes_id) REFERENCES termometro_sancoes_administrativas (id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

COMMIT;
