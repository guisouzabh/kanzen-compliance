START TRANSACTION;

CREATE TABLE IF NOT EXISTS privacy_cases (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  protocolo varchar(40) NOT NULL,
  tipo_case enum('EVENTO_INCIDENTE') NOT NULL DEFAULT 'EVENTO_INCIDENTE',
  origem enum('INTERNO','EXTERNO') NOT NULL,
  titulo varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci NOT NULL,
  status enum('ABERTO','EM_TRIAGEM','EM_ANALISE','DECISAO_COMUNICACAO','CONCLUIDO','DESCARTADO')
    NOT NULL DEFAULT 'ABERTO',
  severidade enum('ALTA','MEDIA','BAIXA') NOT NULL DEFAULT 'MEDIA',
  responsavel_id int NULL,
  prazo date NULL,
  anonimo tinyint(1) NOT NULL DEFAULT 0,
  reportante_nome varchar(255) COLLATE utf8mb4_unicode_ci NULL,
  reportante_email varchar(255) COLLATE utf8mb4_unicode_ci NULL,
  reportante_canal varchar(50) COLLATE utf8mb4_unicode_ci NULL,
  aceita_contato tinyint(1) NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_privacy_cases_tenant_protocolo (tenant_id, protocolo),
  KEY idx_privacy_cases_tenant (tenant_id),
  KEY idx_privacy_cases_empresa (empresa_id),
  KEY idx_privacy_cases_status (status),
  KEY idx_privacy_cases_severidade (severidade),
  KEY idx_privacy_cases_origem (origem),
  CONSTRAINT fk_privacy_cases_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
  CONSTRAINT fk_privacy_cases_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS privacy_case_incident_details (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  privacy_case_id int NOT NULL,
  dados_afetados text COLLATE utf8mb4_unicode_ci NULL,
  titulares_afetados_estimado int NULL,
  impacto_descricao text COLLATE utf8mb4_unicode_ci NULL,
  medidas_contencao text COLLATE utf8mb4_unicode_ci NULL,
  decisao_comunicar_anpd enum('PENDENTE','SIM','NAO') NOT NULL DEFAULT 'PENDENTE',
  decisao_comunicar_titulares enum('PENDENTE','SIM','NAO') NOT NULL DEFAULT 'PENDENTE',
  justificativa_decisao text COLLATE utf8mb4_unicode_ci NULL,
  data_decisao datetime NULL,
  decisao_por_usuario_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_privacy_case_incident_details_case (tenant_id, privacy_case_id),
  KEY idx_privacy_case_incident_details_tenant (tenant_id),
  KEY idx_privacy_case_incident_details_case (privacy_case_id),
  CONSTRAINT fk_privacy_case_incident_details_case
    FOREIGN KEY (privacy_case_id) REFERENCES privacy_cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_privacy_case_incident_details_decisor
    FOREIGN KEY (decisao_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS privacy_case_timeline (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  privacy_case_id int NOT NULL,
  evento_tipo enum(
    'CRIACAO',
    'ATUALIZACAO',
    'COMENTARIO',
    'MUDANCA_STATUS',
    'MUDANCA_SEVERIDADE',
    'DECISAO_COMUNICACAO',
    'ANEXO_ADICIONADO',
    'ANEXO_REMOVIDO'
  ) NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci NOT NULL,
  metadata_json text COLLATE utf8mb4_unicode_ci NULL,
  criado_por_usuario_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_privacy_case_timeline_tenant_case (tenant_id, privacy_case_id),
  KEY idx_privacy_case_timeline_tipo (evento_tipo),
  CONSTRAINT fk_privacy_case_timeline_case
    FOREIGN KEY (privacy_case_id) REFERENCES privacy_cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_privacy_case_timeline_usuario
    FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS privacy_case_attachments (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  privacy_case_id int NOT NULL,
  nome_arquivo varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  caminho_arquivo varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_mime varchar(120) COLLATE utf8mb4_unicode_ci NULL,
  tamanho_bytes bigint NOT NULL,
  hash_arquivo varchar(128) COLLATE utf8mb4_unicode_ci NULL,
  enviado_por_usuario_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_privacy_case_attachments_tenant_case (tenant_id, privacy_case_id),
  CONSTRAINT fk_privacy_case_attachments_case
    FOREIGN KEY (privacy_case_id) REFERENCES privacy_cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_privacy_case_attachments_usuario
    FOREIGN KEY (enviado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
