-- Tabela documento_conteudo (homologacao)

CREATE TABLE `documento_conteudo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `documento_empresa_id` int NOT NULL,
  `versao` int NOT NULL DEFAULT '1',
  `status` enum('RASCUNHO','EM_REVISAO','APROVADO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `titulo_versao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `html` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_data` longtext COLLATE utf8mb4_unicode_ci,
  `criado_por_usuario_id` int DEFAULT NULL,
  `revisado_por_usuario_id` int DEFAULT NULL,
  `aprovado_por_usuario_id` int DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_docconteudo_versao` (`tenant_id`,`documento_empresa_id`,`versao`),
  KEY `idx_docconteudo_docemp` (`tenant_id`,`documento_empresa_id`),
  KEY `idx_docconteudo_status` (`tenant_id`,`status`),
  KEY `fk_docconteudo_docemp` (`documento_empresa_id`),
  CONSTRAINT `fk_docconteudo_docemp` FOREIGN KEY (`documento_empresa_id`) REFERENCES `documentos_empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
