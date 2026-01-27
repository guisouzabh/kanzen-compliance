-- Tabelas para documentos_empresa e documentos_arquivos (homologacao)

CREATE TABLE `documentos_empresa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `documento_regulatorio_id` int NOT NULL,
  `status` enum('NAO_APLICAVEL','PENDENTE','EM_ELABORACAO','VIGENTE','VENCIDO') NOT NULL DEFAULT 'PENDENTE',
  `data_emissao` date DEFAULT NULL,
  `data_validade` date DEFAULT NULL,
  `responsavel_area_id` int DEFAULT NULL,
  `usuario_responsavel_id` int DEFAULT NULL,
  `responsavel_tecnico` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_empresa` (`tenant_id`,`empresa_id`,`documento_regulatorio_id`),
  KEY `idx_docemp_tenant` (`tenant_id`),
  KEY `idx_docemp_doc` (`documento_regulatorio_id`),
  KEY `idx_docemp_status` (`status`),
  KEY `idx_docemp_validade` (`data_validade`),
  CONSTRAINT `fk_docemp_docreg` FOREIGN KEY (`documento_regulatorio_id`) REFERENCES `documentos_regulatorios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `documentos_arquivos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `documento_empresa_id` int NOT NULL,
  `tipo_arquivo` enum('DOCUMENTO_PRINCIPAL','LAUDO','ANEXO','COMPROVANTE','OUTRO') NOT NULL,
  `nome_arquivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caminho_arquivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hash_arquivo` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `versao` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_upload` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_docarq_tenant` (`tenant_id`),
  KEY `idx_docarq_docemp` (`documento_empresa_id`),
  CONSTRAINT `fk_docarq_docemp` FOREIGN KEY (`documento_empresa_id`) REFERENCES `documentos_empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
