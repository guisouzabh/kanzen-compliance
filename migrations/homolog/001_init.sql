-- rlk.classificacoes definição

CREATE TABLE `classificacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_classificacoes_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_base definição

CREATE TABLE `requisito_base` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.tenants definição

CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documentos_regulatorios definição

CREATE TABLE `documentos_regulatorios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `classificacao_id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sigla` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_legal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orgao_emissor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `obrigatoriedade` enum('OBRIGATORIO','CONDICIONAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodicidade` enum('UNICO','ANUAL','BIENAL','TRIENAL','QUINQUENAL','EVENTUAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `exige_responsavel_tecnico` tinyint(1) DEFAULT '0',
  `exige_assinatura` tinyint(1) DEFAULT '0',
  `exige_validade` tinyint(1) DEFAULT '1',
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_reg_tenant` (`tenant_id`),
  KEY `idx_doc_reg_classificacao` (`classificacao_id`),
  CONSTRAINT `fk_doc_reg_classificacao` FOREIGN KEY (`classificacao_id`) REFERENCES `classificacoes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.empresas definição

CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matriz_ou_filial` enum('MATRIZ','FILIAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `razao_social` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_empresas_tenants` (`tenant_id`),
  CONSTRAINT `fk_empresas_tenants` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisitos definição

CREATE TABLE `requisitos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisito_base_id` int NOT NULL DEFAULT '1',
  `tenant_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('LEGAL','INTERNO','EXTERNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('CONFORME','NAO_CONFORME','EM_ANALISE','SEM_ANALISE','EM_REANALISE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `origem` enum('MUNICIPAL','ESTADUAL','FEDERAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `modo` enum('ATIVO','RASCUNHO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RASCUNHO',
  `criticidade` tinyint NOT NULL DEFAULT '3',
  `prioridade` tinyint NOT NULL DEFAULT '3',
  `classificacao_id` int DEFAULT NULL,
  `area_responsavel_id` int DEFAULT NULL,
  `usuario_responsavel_id` int DEFAULT NULL,
  `data_limite_conformidade` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_requisitos_tenant` (`tenant_id`),
  KEY `fk_requisito_classificacao` (`classificacao_id`),
  KEY `fk_requisitos_base` (`requisito_base_id`),
  CONSTRAINT `fk_requisito_classificacao` FOREIGN KEY (`classificacao_id`) REFERENCES `classificacoes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_requisitos_base` FOREIGN KEY (`requisito_base_id`) REFERENCES `requisito_base` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.unidades definição

CREATE TABLE `unidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_unidades_tenant` (`tenant_id`),
  KEY `fk_unidades_empresa` (`empresa_id`),
  CONSTRAINT `fk_unidades_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.areas definição

CREATE TABLE `areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `unidade_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_areas_tenant` (`tenant_id`),
  KEY `idx_areas_parent` (`parent_id`),
  KEY `fk_area_empresa` (`empresa_id`),
  KEY `idx_areas_unidade` (`unidade_id`),
  CONSTRAINT `fk_area_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_area_parent` FOREIGN KEY (`parent_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_areas_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_checkins definição

CREATE TABLE `requisito_checkins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `requisito_id` int NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` datetime NOT NULL,
  `responsavel` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anexo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('CONFORME','NAO_CONFORME','EM_ANALISE','SEM_ANALISE','EM_REANALISE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checkin_tenant` (`tenant_id`),
  KEY `fk_checkin_requisito` (`requisito_id`),
  CONSTRAINT `fk_checkin_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_outras_areas definição

CREATE TABLE `requisito_outras_areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `requisito_id` int NOT NULL,
  `area_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_outras_areas_tenant` (`tenant_id`),
  KEY `fk_outras_area_requisito` (`requisito_id`),
  KEY `fk_outras_area_area` (`area_id`),
  CONSTRAINT `fk_outras_area_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_outras_area_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.tenant_tags definição

CREATE TABLE `tenant_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `tag` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tags_tenant` (`tenant_id`),
  KEY `idx_tags_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.subareas definição

CREATE TABLE `subareas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `area_id` int NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subareas_tenant` (`tenant_id`),
  KEY `fk_subareas_area` (`area_id`),
  CONSTRAINT `fk_subareas_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.usuarios definição

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL DEFAULT '1',
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `empresa_id` int DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_tenants` (`tenant_id`),
  KEY `idx_usuario_empresa` (`empresa_id`),
  KEY `idx_usuario_area` (`area_id`),
  CONSTRAINT `fk_usuario_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usuarios_tenants` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.area_empresas definição

CREATE TABLE `area_empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `area_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_area_empresa` (`tenant_id`,`area_id`,`empresa_id`),
  KEY `idx_area_empresas_tenant` (`tenant_id`),
  KEY `fk_area_empresas_area` (`area_id`),
  KEY `fk_area_empresas_empresa` (`empresa_id`),
  CONSTRAINT `fk_area_empresas_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_area_empresas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.inbox_notificacoes definição

CREATE TABLE `inbox_notificacoes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `usuario_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `corpo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('ALERTA','AVISO','INFO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `prioridade` enum('ALTA','MEDIA','BAIXA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIA',
  `status` enum('NAO_LIDA','LIDA','ARQUIVADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NAO_LIDA',
  `remetente` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia_tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_id` bigint unsigned DEFAULT NULL,
  `data_entrega_email` datetime DEFAULT NULL,
  `data_entrega_sms` datetime DEFAULT NULL,
  `data_entrega_whatsapp` datetime DEFAULT NULL,
  `lido_em` datetime DEFAULT NULL,
  `arquivado_em` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inbox_tenant_usuario_status` (`tenant_id`,`usuario_id`,`status`),
  KEY `idx_inbox_tenant_usuario_created` (`tenant_id`,`usuario_id`,`created_at`),
  KEY `fk_inbox_usuario` (`usuario_id`),
  CONSTRAINT `fk_inbox_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_tarefas definição

CREATE TABLE `requisito_tarefas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `requisito_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `responsavel_id` int DEFAULT NULL,
  `status` enum('ABERTO','FECHADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABERTO',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tarefas_tenant` (`tenant_id`),
  KEY `fk_tarefa_requisito` (`requisito_id`),
  KEY `fk_tarefa_usuario` (`responsavel_id`),
  CONSTRAINT `fk_tarefa_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tarefa_usuario` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.subarea2 definição

CREATE TABLE `subarea2` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `subarea_id` int NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subarea2_tenant` (`tenant_id`),
  KEY `fk_subarea2_subarea` (`subarea_id`),
  CONSTRAINT `fk_subarea2_subarea` FOREIGN KEY (`subarea_id`) REFERENCES `subareas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
