-- Tabelas de seções de documento (homologacao)

CREATE TABLE documento_modelo_secao (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  documento_regulatorio_id INT NOT NULL,
  chave VARCHAR(80) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT DEFAULT NULL,
  ordem INT NOT NULL DEFAULT 1,
  obrigatoria BOOLEAN NOT NULL DEFAULT TRUE,
  tipo_input ENUM('RICH_TEXT','TEXT','JSON') NOT NULL DEFAULT 'RICH_TEXT',
  schema_json LONGTEXT DEFAULT NULL,
  template_html LONGTEXT DEFAULT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_modelo_secao (tenant_id, documento_regulatorio_id, chave),
  KEY idx_modelo_doc (tenant_id, documento_regulatorio_id, ordem),
  CONSTRAINT fk_modelo_secao_docreg
    FOREIGN KEY (documento_regulatorio_id)
    REFERENCES documentos_regulatorios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documento_conteudo_secao (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  documento_conteudo_id INT NOT NULL,
  modelo_secao_id INT NOT NULL,
  status ENUM('NAO_INICIADO','EM_ANDAMENTO','CONCLUIDO') NOT NULL DEFAULT 'NAO_INICIADO',
  conteudo_html LONGTEXT DEFAULT NULL,
  dados_json LONGTEXT DEFAULT NULL,
  checksum VARCHAR(64) DEFAULT NULL,
  atualizado_por_usuario_id INT DEFAULT NULL,
  atualizado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteudo_secao (tenant_id, documento_conteudo_id, modelo_secao_id),
  KEY idx_conteudo_secao_doc (tenant_id, documento_conteudo_id),
  KEY idx_conteudo_secao_status (tenant_id, status),
  CONSTRAINT fk_conteudo_secao_conteudo
    FOREIGN KEY (documento_conteudo_id)
    REFERENCES documento_conteudo(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_conteudo_secao_modelo
    FOREIGN KEY (modelo_secao_id)
    REFERENCES documento_modelo_secao(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
