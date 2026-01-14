-- Tabela de parâmetros de lista para campos customizados de requisitos
CREATE TABLE IF NOT EXISTS requisitos_parametros_lista (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  campo VARCHAR(50) NOT NULL, -- identificar qual lista (ex.: lista_1, lista_2, lista_3)
  valor VARCHAR(255) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rpl_tenant_campo (tenant_id, campo),
  KEY idx_rpl_tenant (tenant_id)
);

-- Tabela 1:1 com requisitos para campos adicionais por tenant
CREATE TABLE IF NOT EXISTS requisito_campos_adicionais (
  requisito_id BIGINT UNSIGNED NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  campo_texto_1 VARCHAR(255) NULL,
  campo_texto_2 VARCHAR(255) NULL,
  campo_texto_3 VARCHAR(255) NULL,
  campo_texto_4 VARCHAR(255) NULL,
  campo_texto_5 VARCHAR(255) NULL,
  lista_1_id BIGINT UNSIGNED NULL,
  lista_2_id BIGINT UNSIGNED NULL,
  lista_3_id BIGINT UNSIGNED NULL,
  numero_1 DECIMAL(15,2) NULL,
  numero_2 DECIMAL(15,2) NULL,
  numero_3 DECIMAL(15,2) NULL,
  data_1 DATE NULL,
  data_2 DATE NULL,
  data_3 DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (requisito_id),
  UNIQUE KEY uk_requisito_tenant (tenant_id, requisito_id),
  KEY idx_rca_tenant (tenant_id),
  KEY idx_rca_lista1 (lista_1_id),
  KEY idx_rca_lista2 (lista_2_id),
  KEY idx_rca_lista3 (lista_3_id),
  CONSTRAINT fk_rca_requisito FOREIGN KEY (requisito_id) REFERENCES requisitos(id) ON DELETE CASCADE,
  CONSTRAINT fk_rca_lista1 FOREIGN KEY (lista_1_id) REFERENCES requisitos_parametros_lista(id) ON DELETE SET NULL,
  CONSTRAINT fk_rca_lista2 FOREIGN KEY (lista_2_id) REFERENCES requisitos_parametros_lista(id) ON DELETE SET NULL,
  CONSTRAINT fk_rca_lista3 FOREIGN KEY (lista_3_id) REFERENCES requisitos_parametros_lista(id) ON DELETE SET NULL
);
