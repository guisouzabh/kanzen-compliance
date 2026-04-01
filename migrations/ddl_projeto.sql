-- rlk.categorias_dados_pessoais definição

CREATE TABLE `categorias_dados_pessoais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_dado_tenant_nome` (`tenant_id`,`nome`),
  KEY `idx_cat_dado_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.classificacoes definição

CREATE TABLE `classificacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_classificacoes_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.comites definição

CREATE TABLE `comites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  `tipo` enum('COMITE','DPO') NOT NULL DEFAULT 'COMITE',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comites_tenant_nome` (`tenant_id`,`nome`),
  KEY `idx_comites_tenant` (`tenant_id`),
  KEY `idx_comites_tenant_tipo` (`tenant_id`,`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_leads definição

CREATE TABLE `diagnostico_leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `celular` varchar(50) DEFAULT NULL,
  `empresa` varchar(255) NOT NULL,
  `ramo` varchar(255) DEFAULT NULL,
  `num_funcionarios` varchar(50) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(100) DEFAULT NULL,
  `nota_geral` decimal(5,1) DEFAULT NULL,
  `resultado_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- rlk.inventario_dados_novo definição

CREATE TABLE `inventario_dados_novo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `categoria` varchar(255) NOT NULL,
  `dado_tratado` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_inv_tenant` (`tenant_id`),
  KEY `idx_inv_categoria` (`categoria`),
  KEY `fk_inv_cat_dado` (`categoria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.parametros_maturidade definição

CREATE TABLE `parametros_maturidade` (
  `id` tinyint(4) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.processos definição

CREATE TABLE `processos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_processo_tenant` (`tenant_id`),
  KEY `fk_processo_parent` (`parent_id`),
  CONSTRAINT `fk_processo_parent` FOREIGN KEY (`parent_id`) REFERENCES `processos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_base definição

CREATE TABLE `requisito_base` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.status_lgpd definição

CREATE TABLE `status_lgpd` (
  `id` tinyint(4) NOT NULL,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.tenant_tags definição

CREATE TABLE `tenant_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL DEFAULT 'REQUISITO',
  `entity_id` int(11) NOT NULL,
  `tag` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tags_tenant` (`tenant_id`),
  KEY `idx_tags_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.tenants definição

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.termometro_sancoes_administrativas definição

CREATE TABLE `termometro_sancoes_administrativas` (
  `id` tinyint(4) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `sancao` varchar(100) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.dm_escopo definição

CREATE TABLE `dm_escopo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dm_escopo_tenant_nome` (`tenant_id`,`nome`),
  KEY `idx_dm_escopo_tenant` (`tenant_id`),
  CONSTRAINT `fk_dm_escopo_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documentos_regulatorios definição

CREATE TABLE `documentos_regulatorios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `classificacao_id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `sigla` varchar(50) DEFAULT NULL,
  `descricao` text NOT NULL,
  `base_legal` varchar(255) DEFAULT NULL,
  `orgao_emissor` varchar(255) DEFAULT NULL,
  `obrigatoriedade` enum('OBRIGATORIO','CONDICIONAL') NOT NULL,
  `periodicidade` enum('UNICO','ANUAL','BIENAL','TRIENAL','QUINQUENAL','EVENTUAL') NOT NULL,
  `exige_responsavel_tecnico` tinyint(1) DEFAULT 0,
  `exige_assinatura` tinyint(1) DEFAULT 0,
  `exige_validade` tinyint(1) DEFAULT 1,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_doc_reg_tenant` (`tenant_id`),
  KEY `idx_doc_reg_classificacao` (`classificacao_id`),
  CONSTRAINT `fk_doc_reg_classificacao` FOREIGN KEY (`classificacao_id`) REFERENCES `classificacoes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.empresas definição

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `nome` varchar(150) NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `matriz_ou_filial` enum('MATRIZ','FILIAL') NOT NULL,
  `razao_social` varchar(200) NOT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `parametro_maturidade` tinyint(4) NOT NULL DEFAULT 0,
  `termometro_sancoes_id` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_empresas_tenants` (`tenant_id`),
  KEY `fk_empresas_parametro_maturidade` (`parametro_maturidade`),
  KEY `fk_empresas_termometro_sancoes` (`termometro_sancoes_id`),
  CONSTRAINT `fk_empresas_parametro_maturidade` FOREIGN KEY (`parametro_maturidade`) REFERENCES `parametros_maturidade` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_empresas_tenants` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_empresas_termometro_sancoes` FOREIGN KEY (`termometro_sancoes_id`) REFERENCES `termometro_sancoes_administrativas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.inventario_dados definição

CREATE TABLE `inventario_dados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `categoria` varchar(255) NOT NULL,
  `dado_tratado` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `dados_sensiveis` tinyint(1) NOT NULL DEFAULT 0,
  `dados_menor` tinyint(1) NOT NULL DEFAULT 0,
  `tempo_armazenamento` varchar(255) DEFAULT NULL,
  `local_armazenamento` varchar(255) DEFAULT NULL,
  `processo_id` int(11) DEFAULT NULL,
  `quantidade_existente` int(11) DEFAULT NULL,
  `quantidade_inserida_mes` int(11) DEFAULT NULL,
  `quantidade_tratada_mes` int(11) DEFAULT NULL,
  `principal_agente` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inv_tenant` (`tenant_id`),
  KEY `idx_inv_categoria` (`categoria`),
  KEY `fk_inv_cat_dado` (`categoria_id`),
  KEY `fk_inv_processo` (`processo_id`),
  CONSTRAINT `fk_inv_cat_dado` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_dados_pessoais` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_processo` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisitos definição

CREATE TABLE `requisitos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requisito_base_id` int(11) NOT NULL DEFAULT 1,
  `tenant_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `tipo` enum('LEGAL','INTERNO','EXTERNO') NOT NULL,
  `status` enum('CONFORME','NAO_CONFORME','EM_ANALISE','SEM_ANALISE','EM_REANALISE') NOT NULL,
  `origem` enum('MUNICIPAL','ESTADUAL','FEDERAL') NOT NULL,
  `modo` enum('ATIVO','RASCUNHO') NOT NULL DEFAULT 'RASCUNHO',
  `criticidade` tinyint(4) NOT NULL DEFAULT 3,
  `prioridade` tinyint(4) NOT NULL DEFAULT 3,
  `classificacao_id` int(11) DEFAULT NULL,
  `area_responsavel_id` int(11) DEFAULT NULL,
  `usuario_responsavel_id` int(11) DEFAULT NULL,
  `data_limite_conformidade` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_requisitos_tenant` (`tenant_id`),
  KEY `fk_requisito_classificacao` (`classificacao_id`),
  KEY `fk_requisitos_base` (`requisito_base_id`),
  CONSTRAINT `fk_requisito_classificacao` FOREIGN KEY (`classificacao_id`) REFERENCES `classificacoes` (`id`),
  CONSTRAINT `fk_requisitos_base` FOREIGN KEY (`requisito_base_id`) REFERENCES `requisito_base` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.unidades definição

CREATE TABLE `unidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_unidades_tenant` (`tenant_id`),
  KEY `fk_unidades_empresa` (`empresa_id`),
  KEY `idx_unidades_ativo` (`tenant_id`,`ativo`),
  CONSTRAINT `fk_unidades_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.areas definição

CREATE TABLE `areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `unidade_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_areas_tenant` (`tenant_id`),
  KEY `idx_areas_parent` (`parent_id`),
  KEY `fk_area_empresa` (`empresa_id`),
  KEY `idx_areas_unidade` (`unidade_id`),
  KEY `idx_areas_ativo` (`tenant_id`,`ativo`),
  CONSTRAINT `fk_area_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_area_parent` FOREIGN KEY (`parent_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_areas_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_modelos definição

CREATE TABLE `diagnostico_modelos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `dm_escopo_id` int(11) NOT NULL,
  `versao` int(11) NOT NULL DEFAULT 1,
  `ativo` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lgpd_diag_modelo_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_modelo_ativo` (`tenant_id`,`ativo`),
  KEY `fk_diagnostico_modelos_escopo` (`dm_escopo_id`),
  CONSTRAINT `fk_diagnostico_modelos_escopo` FOREIGN KEY (`dm_escopo_id`) REFERENCES `dm_escopo` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_perguntas definição

CREATE TABLE `diagnostico_perguntas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `modelo_id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `dominio` varchar(100) NOT NULL,
  `macro_dominio` varchar(100) NOT NULL DEFAULT '',
  `pergunta` text NOT NULL,
  `opcao_0` varchar(255) NOT NULL,
  `opcao_1` varchar(255) NOT NULL,
  `opcao_2` varchar(255) NOT NULL,
  `opcao_3` varchar(255) NOT NULL,
  `peso` tinyint(4) NOT NULL DEFAULT 1,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `ativo` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lgpd_diag_perguntas_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_perguntas_modelo` (`modelo_id`),
  KEY `idx_lgpd_diag_perguntas_dominio` (`dominio`),
  CONSTRAINT `fk_lgpd_diag_perguntas_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `diagnostico_modelos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_modelo_secao definição

CREATE TABLE `documento_modelo_secao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_regulatorio_id` int(11) NOT NULL,
  `chave` varchar(80) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ordem` int(11) NOT NULL DEFAULT 1,
  `obrigatoria` tinyint(1) NOT NULL DEFAULT 1,
  `tipo_input` enum('RICH_TEXT','TEXT','JSON') NOT NULL DEFAULT 'RICH_TEXT',
  `schema_json` longtext DEFAULT NULL,
  `template_html` longtext DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modelo_secao` (`tenant_id`,`documento_regulatorio_id`,`chave`),
  KEY `idx_modelo_doc` (`tenant_id`,`documento_regulatorio_id`,`ordem`),
  KEY `fk_modelo_secao_docreg` (`documento_regulatorio_id`),
  CONSTRAINT `fk_modelo_secao_docreg` FOREIGN KEY (`documento_regulatorio_id`) REFERENCES `documentos_regulatorios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=168 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_modelo_secao_links definição

CREATE TABLE `documento_modelo_secao_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `modelo_secao_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mslink_tenant` (`tenant_id`),
  KEY `idx_mslink_modelo` (`modelo_secao_id`),
  CONSTRAINT `fk_mslink_modelo` FOREIGN KEY (`modelo_secao_id`) REFERENCES `documento_modelo_secao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_requisito definição

CREATE TABLE `documento_requisito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_id` int(11) NOT NULL,
  `requisito_id` int(11) NOT NULL,
  `obrigatorio` tinyint(1) NOT NULL DEFAULT 1,
  `cobre_parcial` tinyint(1) NOT NULL DEFAULT 0,
  `prioridade` int(11) NOT NULL DEFAULT 1,
  `observacao` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_req` (`tenant_id`,`documento_id`,`requisito_id`),
  KEY `idx_docreq_doc` (`tenant_id`,`documento_id`),
  KEY `idx_docreq_req` (`tenant_id`,`requisito_id`),
  KEY `fk_docreq_doc` (`documento_id`),
  KEY `fk_docreq_req` (`requisito_id`),
  CONSTRAINT `fk_docreq_doc` FOREIGN KEY (`documento_id`) REFERENCES `documentos_regulatorios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_docreq_req` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documentos_empresa definição

CREATE TABLE `documentos_empresa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `documento_regulatorio_id` int(11) NOT NULL,
  `status` enum('NAO_APLICAVEL','PENDENTE','EM_ELABORACAO','VIGENTE','VENCIDO') NOT NULL DEFAULT 'PENDENTE',
  `data_emissao` date DEFAULT NULL,
  `data_validade` date DEFAULT NULL,
  `responsavel_area_id` int(11) DEFAULT NULL,
  `usuario_responsavel_id` int(11) DEFAULT NULL,
  `responsavel_tecnico` varchar(255) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_empresa` (`tenant_id`,`empresa_id`,`documento_regulatorio_id`),
  KEY `idx_docemp_tenant` (`tenant_id`),
  KEY `idx_docemp_doc` (`documento_regulatorio_id`),
  KEY `idx_docemp_status` (`status`),
  KEY `idx_docemp_validade` (`data_validade`),
  CONSTRAINT `fk_docemp_docreg` FOREIGN KEY (`documento_regulatorio_id`) REFERENCES `documentos_regulatorios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_checkins definição

CREATE TABLE `requisito_checkins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `requisito_id` int(11) NOT NULL,
  `descricao` text NOT NULL,
  `data` datetime NOT NULL,
  `responsavel` varchar(255) NOT NULL,
  `anexo` varchar(255) DEFAULT NULL,
  `status` enum('CONFORME','NAO_CONFORME','EM_ANALISE','SEM_ANALISE','EM_REANALISE') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_checkin_tenant` (`tenant_id`),
  KEY `fk_checkin_requisito` (`requisito_id`),
  CONSTRAINT `fk_checkin_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_outras_areas definição

CREATE TABLE `requisito_outras_areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `requisito_id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_outras_areas_tenant` (`tenant_id`),
  KEY `fk_outras_area_requisito` (`requisito_id`),
  KEY `fk_outras_area_area` (`area_id`),
  CONSTRAINT `fk_outras_area_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_outras_area_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.subareas definição

CREATE TABLE `subareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subareas_tenant` (`tenant_id`),
  KEY `fk_subareas_area` (`area_id`),
  KEY `idx_subareas_ativo` (`tenant_id`,`ativo`),
  CONSTRAINT `fk_subareas_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.usuarios definição

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `empresa_id` int(11) DEFAULT NULL,
  `area_id` int(11) DEFAULT NULL,
  `role` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_tenants` (`tenant_id`),
  KEY `idx_usuario_empresa` (`empresa_id`),
  KEY `idx_usuario_area` (`area_id`),
  CONSTRAINT `fk_usuario_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usuarios_tenants` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.area_empresas definição

CREATE TABLE `area_empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_area_empresa` (`tenant_id`,`area_id`,`empresa_id`),
  KEY `idx_area_empresas_tenant` (`tenant_id`),
  KEY `fk_area_empresas_area` (`area_id`),
  KEY `fk_area_empresas_empresa` (`empresa_id`),
  CONSTRAINT `fk_area_empresas_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_area_empresas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.comite_membros definição

CREATE TABLE `comite_membros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `comite_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `papel` enum('PRESIDENTE','SECRETARIO','MEMBRO') NOT NULL DEFAULT 'MEMBRO',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comite_membros_unico` (`tenant_id`,`comite_id`,`usuario_id`),
  KEY `idx_comite_membros_tenant` (`tenant_id`),
  KEY `idx_comite_membros_comite` (`comite_id`),
  KEY `idx_comite_membros_usuario` (`usuario_id`),
  CONSTRAINT `fk_comite_membros_comite` FOREIGN KEY (`comite_id`) REFERENCES `comites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comite_membros_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_execucoes definição

CREATE TABLE `diagnostico_execucoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `modelo_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'RASCUNHO',
  `nota_geral` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_peso` int(11) NOT NULL DEFAULT 0,
  `max_pontos` int(11) NOT NULL DEFAULT 0,
  `pontos` decimal(10,2) NOT NULL DEFAULT 0.00,
  `criado_por_usuario_id` int(11) DEFAULT NULL,
  `atualizado_por_usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lgpd_diag_exec_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_exec_empresa` (`empresa_id`),
  KEY `idx_lgpd_diag_exec_modelo` (`modelo_id`),
  KEY `fk_lgpd_diag_exec_criado_por` (`criado_por_usuario_id`),
  KEY `fk_lgpd_diag_exec_atualizado_por` (`atualizado_por_usuario_id`),
  CONSTRAINT `fk_lgpd_diag_exec_atualizado_por` FOREIGN KEY (`atualizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_lgpd_diag_exec_criado_por` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_lgpd_diag_exec_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lgpd_diag_exec_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `diagnostico_modelos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_respostas definição

CREATE TABLE `diagnostico_respostas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `execucao_id` int(11) NOT NULL,
  `pergunta_id` int(11) NOT NULL,
  `dominio` varchar(100) NOT NULL,
  `macro_dominio` varchar(100) DEFAULT NULL,
  `opcao` tinyint(4) NOT NULL,
  `valor` tinyint(4) NOT NULL,
  `peso` tinyint(4) NOT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lgpd_diag_resposta` (`execucao_id`,`pergunta_id`),
  KEY `idx_lgpd_diag_resposta_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_resposta_exec` (`execucao_id`),
  KEY `fk_lgpd_diag_resposta_pergunta` (`pergunta_id`),
  CONSTRAINT `fk_lgpd_diag_resposta_exec` FOREIGN KEY (`execucao_id`) REFERENCES `diagnostico_execucoes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lgpd_diag_resposta_pergunta` FOREIGN KEY (`pergunta_id`) REFERENCES `diagnostico_perguntas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=202 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_resultados_dominio definição

CREATE TABLE `diagnostico_resultados_dominio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `execucao_id` int(11) NOT NULL,
  `dominio` varchar(100) NOT NULL,
  `nota` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_peso` int(11) NOT NULL DEFAULT 0,
  `max_pontos` int(11) NOT NULL DEFAULT 0,
  `pontos` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lgpd_diag_resultado` (`execucao_id`,`dominio`),
  KEY `idx_lgpd_diag_resultado_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_resultado_exec` (`execucao_id`),
  CONSTRAINT `fk_lgpd_diag_resultado_exec` FOREIGN KEY (`execucao_id`) REFERENCES `diagnostico_execucoes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.diagnostico_resultados_macro definição

CREATE TABLE `diagnostico_resultados_macro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `execucao_id` int(11) NOT NULL,
  `macro_dominio` varchar(100) NOT NULL,
  `nota` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_peso` int(11) NOT NULL DEFAULT 0,
  `max_pontos` int(11) NOT NULL DEFAULT 0,
  `pontos` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lgpd_diag_resultado_macro` (`execucao_id`,`macro_dominio`),
  KEY `idx_lgpd_diag_resultado_macro_tenant` (`tenant_id`),
  KEY `idx_lgpd_diag_resultado_macro_exec` (`execucao_id`),
  CONSTRAINT `fk_lgpd_diag_resultado_macro_exec` FOREIGN KEY (`execucao_id`) REFERENCES `diagnostico_execucoes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_conteudo definição

CREATE TABLE `documento_conteudo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_empresa_id` int(11) NOT NULL,
  `versao` int(11) NOT NULL DEFAULT 1,
  `status` enum('RASCUNHO','EM_REVISAO','APROVADO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `titulo_versao` varchar(255) DEFAULT NULL,
  `html` longtext NOT NULL,
  `json_data` longtext DEFAULT NULL,
  `criado_por_usuario_id` int(11) DEFAULT NULL,
  `revisado_por_usuario_id` int(11) DEFAULT NULL,
  `aprovado_por_usuario_id` int(11) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_docconteudo_versao` (`tenant_id`,`documento_empresa_id`,`versao`),
  KEY `idx_docconteudo_docemp` (`tenant_id`,`documento_empresa_id`),
  KEY `idx_docconteudo_status` (`tenant_id`,`status`),
  KEY `fk_docconteudo_docemp` (`documento_empresa_id`),
  CONSTRAINT `fk_docconteudo_docemp` FOREIGN KEY (`documento_empresa_id`) REFERENCES `documentos_empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_conteudo_secao definição

CREATE TABLE `documento_conteudo_secao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_conteudo_id` int(11) NOT NULL,
  `modelo_secao_id` int(11) NOT NULL,
  `status` enum('NAO_INICIADO','EM_ANDAMENTO','CONCLUIDO') NOT NULL DEFAULT 'NAO_INICIADO',
  `conteudo_html` longtext DEFAULT NULL,
  `dados_json` longtext DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `atualizado_por_usuario_id` int(11) DEFAULT NULL,
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conteudo_secao` (`tenant_id`,`documento_conteudo_id`,`modelo_secao_id`),
  KEY `idx_conteudo_secao_doc` (`tenant_id`,`documento_conteudo_id`),
  KEY `idx_conteudo_secao_status` (`tenant_id`,`status`),
  KEY `fk_conteudo_secao_conteudo` (`documento_conteudo_id`),
  KEY `fk_conteudo_secao_modelo` (`modelo_secao_id`),
  CONSTRAINT `fk_conteudo_secao_conteudo` FOREIGN KEY (`documento_conteudo_id`) REFERENCES `documento_conteudo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conteudo_secao_modelo` FOREIGN KEY (`modelo_secao_id`) REFERENCES `documento_modelo_secao` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_publicacao definição

CREATE TABLE `documento_publicacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_conteudo_id` int(11) NOT NULL,
  `formato` enum('PDF') NOT NULL DEFAULT 'PDF',
  `caminho_arquivo` varchar(500) NOT NULL,
  `hash_arquivo` varchar(128) DEFAULT NULL,
  `publicado_por_usuario_id` int(11) DEFAULT NULL,
  `publicado_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_docpub_conteudo` (`tenant_id`,`documento_conteudo_id`),
  KEY `fk_docpub_conteudo` (`documento_conteudo_id`),
  CONSTRAINT `fk_docpub_conteudo` FOREIGN KEY (`documento_conteudo_id`) REFERENCES `documento_conteudo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documento_workflow_log definição

CREATE TABLE `documento_workflow_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_conteudo_id` int(11) NOT NULL,
  `de_status` enum('RASCUNHO','EM_REVISAO','APROVADO','PUBLICADO') DEFAULT NULL,
  `para_status` enum('RASCUNHO','EM_REVISAO','APROVADO','PUBLICADO') NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `comentario` varchar(500) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_docwf_conteudo` (`tenant_id`,`documento_conteudo_id`),
  KEY `idx_docwf_status` (`tenant_id`,`para_status`),
  KEY `fk_docwf_conteudo` (`documento_conteudo_id`),
  CONSTRAINT `fk_docwf_conteudo` FOREIGN KEY (`documento_conteudo_id`) REFERENCES `documento_conteudo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.documentos_arquivos definição

CREATE TABLE `documentos_arquivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `documento_empresa_id` int(11) NOT NULL,
  `tipo_arquivo` enum('DOCUMENTO_PRINCIPAL','LAUDO','ANEXO','COMPROVANTE','OUTRO') NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `caminho_arquivo` varchar(500) NOT NULL,
  `hash_arquivo` varchar(128) DEFAULT NULL,
  `versao` varchar(50) DEFAULT NULL,
  `data_upload` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_docarq_tenant` (`tenant_id`),
  KEY `idx_docarq_docemp` (`documento_empresa_id`),
  CONSTRAINT `fk_docarq_docemp` FOREIGN KEY (`documento_empresa_id`) REFERENCES `documentos_empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.empresa_dados_status definição

CREATE TABLE `empresa_dados_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `status_lgpd_id` tinyint(4) NOT NULL,
  `percentual` decimal(5,2) NOT NULL DEFAULT 0.00,
  `descricao_sistema` text DEFAULT NULL,
  `comentarios` text DEFAULT NULL,
  `versao` int(11) NOT NULL DEFAULT 1,
  `criado_por_usuario_id` int(11) DEFAULT NULL,
  `atualizado_por_usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_empresa_dados_status_tenant` (`tenant_id`),
  KEY `idx_empresa_dados_status_empresa` (`empresa_id`),
  KEY `idx_empresa_dados_status_status` (`status_lgpd_id`),
  KEY `fk_empresa_dados_status_criado_por` (`criado_por_usuario_id`),
  KEY `fk_empresa_dados_status_atualizado_por` (`atualizado_por_usuario_id`),
  CONSTRAINT `fk_empresa_dados_status_atualizado_por` FOREIGN KEY (`atualizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_empresa_dados_status_criado_por` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_empresa_dados_status_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_empresa_dados_status_status` FOREIGN KEY (`status_lgpd_id`) REFERENCES `status_lgpd` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.inbox_notificacoes definição

CREATE TABLE `inbox_notificacoes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `corpo` text NOT NULL,
  `tipo` enum('ALERTA','AVISO','INFO') NOT NULL DEFAULT 'INFO',
  `prioridade` enum('ALTA','MEDIA','BAIXA') NOT NULL DEFAULT 'MEDIA',
  `status` enum('NAO_LIDA','LIDA','ARQUIVADA') NOT NULL DEFAULT 'NAO_LIDA',
  `remetente` varchar(255) NOT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  `referencia_id` bigint(20) unsigned DEFAULT NULL,
  `data_entrega_email` datetime DEFAULT NULL,
  `data_entrega_sms` datetime DEFAULT NULL,
  `data_entrega_whatsapp` datetime DEFAULT NULL,
  `lido_em` datetime DEFAULT NULL,
  `arquivado_em` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_inbox_tenant_usuario_status` (`tenant_id`,`usuario_id`,`status`),
  KEY `idx_inbox_tenant_usuario_created` (`tenant_id`,`usuario_id`,`created_at`),
  KEY `fk_inbox_usuario` (`usuario_id`),
  CONSTRAINT `fk_inbox_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.planos definição

CREATE TABLE `planos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `tipo` enum('ACOES','TREINAMENTO','AUDITORIA') NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` enum('RASCUNHO','EM_ANDAMENTO','CONCLUIDO','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
  `responsavel_id` int(11) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_planos_tenant` (`tenant_id`),
  KEY `idx_planos_empresa` (`empresa_id`),
  KEY `idx_planos_tipo` (`tenant_id`,`tipo`),
  KEY `idx_planos_status` (`tenant_id`,`status`),
  KEY `fk_planos_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_planos_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_planos_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.matriz_acoes definição

CREATE TABLE `matriz_acoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `plano_id` int(11) DEFAULT NULL,
  `acao` varchar(255) NOT NULL,
  `objetivo` text DEFAULT NULL,
  `status` enum('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','IMPEDIDA') NOT NULL DEFAULT 'PLANEJADA',
  `prioridade` tinyint(4) NOT NULL DEFAULT 3,
  `esforco` tinyint(4) NOT NULL DEFAULT 3,
  `prazo` date DEFAULT NULL,
  `status_prazo` enum('NAO_APLICAVEL','NO_PRAZO','ATRASADA') NOT NULL DEFAULT 'NO_PRAZO',
  `origem` text DEFAULT NULL,
  `origem_typ` varchar(50) DEFAULT NULL,
  `origem_id` int(11) DEFAULT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_matriz_acoes_tenant` (`tenant_id`),
  KEY `idx_matriz_acoes_empresa` (`empresa_id`),
  KEY `idx_matriz_acoes_plano` (`plano_id`),
  KEY `idx_matriz_acoes_status` (`status`),
  KEY `idx_matriz_acoes_prazo` (`prazo`),
  KEY `idx_matriz_acoes_origem` (`origem_typ`,`origem_id`),
  KEY `fk_matriz_acoes_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_matriz_acoes_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_matriz_acoes_plano` FOREIGN KEY (`plano_id`) REFERENCES `planos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_matriz_acoes_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.requisito_tarefas definição

CREATE TABLE `requisito_tarefas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `requisito_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `status` enum('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tarefas_tenant` (`tenant_id`),
  KEY `fk_tarefa_requisito` (`requisito_id`),
  KEY `fk_tarefa_usuario` (`responsavel_id`),
  CONSTRAINT `fk_tarefa_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tarefa_usuario` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.solicitacoes_titular definição

CREATE TABLE `solicitacoes_titular` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `protocolo` varchar(40) NOT NULL,
  `canal_entrada` varchar(50) DEFAULT NULL,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `endereco` text DEFAULT NULL,
  `tipo_relacao` enum('CLIENTE','EX_CLIENTE','COLABORADOR','CANDIDATO','PARCEIRO','OUTRO') NOT NULL DEFAULT 'OUTRO',
  `identificador_interno` varchar(100) DEFAULT NULL,
  `periodo_relacao` varchar(100) DEFAULT NULL,
  `tipo_solicitacao` enum('ACESSO','CONFIRMACAO','CORRECAO','ANONIMIZACAO_ELIMINACAO','PORTABILIDADE','REVOGACAO_CONSENTIMENTO','INFORMACOES_COMPARTILHAMENTO','OPOSICAO','OUTRO') NOT NULL,
  `descricao_pedido` text NOT NULL,
  `categorias_dados` text DEFAULT NULL,
  `sistemas` text DEFAULT NULL,
  `canal_resposta` enum('EMAIL','TELEFONE','PORTAL','OUTRO') NOT NULL DEFAULT 'EMAIL',
  `idioma` varchar(20) DEFAULT NULL,
  `declaracao_veracidade` tinyint(1) NOT NULL DEFAULT 0,
  `ciente_prazo` tinyint(1) NOT NULL DEFAULT 0,
  `autorizacao_uso` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('ABERTO','EM_ANALISE','EM_TRATATIVA','CONCLUIDO','NEGADO') NOT NULL DEFAULT 'ABERTO',
  `responsavel_id` int(11) DEFAULT NULL,
  `prazo_resposta` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_solicitacao_titular_protocolo` (`tenant_id`,`protocolo`),
  KEY `idx_solicitacao_titular_tenant` (`tenant_id`),
  KEY `idx_solicitacao_titular_empresa` (`empresa_id`),
  KEY `idx_solicitacao_titular_status` (`status`),
  KEY `fk_solicitacao_titular_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_solicitacao_titular_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitacao_titular_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.subarea2 definição

CREATE TABLE `subarea2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `subarea_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subarea2_tenant` (`tenant_id`),
  KEY `fk_subarea2_subarea` (`subarea_id`),
  KEY `idx_subarea2_ativo` (`tenant_id`,`ativo`),
  CONSTRAINT `fk_subarea2_subarea` FOREIGN KEY (`subarea_id`) REFERENCES `subareas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.turmas_treinamento definição

CREATE TABLE `turmas_treinamento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plano_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `tema` varchar(255) NOT NULL,
  `instrutor` varchar(255) DEFAULT NULL,
  `modalidade` enum('PRESENCIAL','ONLINE','HIBRIDO') NOT NULL DEFAULT 'PRESENCIAL',
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `carga_horaria` decimal(6,1) DEFAULT NULL,
  `local_realizacao` varchar(255) DEFAULT NULL,
  `status` enum('AGENDADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'AGENDADA',
  `responsavel_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_turmas_tenant` (`tenant_id`),
  KEY `idx_turmas_plano` (`plano_id`),
  KEY `idx_turmas_status` (`tenant_id`,`status`),
  KEY `fk_turmas_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_turmas_plano` FOREIGN KEY (`plano_id`) REFERENCES `planos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_turmas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_turmas_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- rlk.auditoria_itens definição

CREATE TABLE `auditoria_itens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plano_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `descricao` varchar(500) NOT NULL,
  `tipo` enum('INTERNA','EXTERNA','TERCEIRA_PARTE') NOT NULL DEFAULT 'INTERNA',
  `status` enum('PENDENTE','EM_ANDAMENTO','CONCLUIDA') NOT NULL DEFAULT 'PENDENTE',
  `resultado` enum('CONFORME','NAO_CONFORME','EM_ANALISE') DEFAULT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `prazo` date DEFAULT NULL,
  `requisito_id` int(11) DEFAULT NULL,
  `processo_id` int(11) DEFAULT NULL,
  `observacao` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_tenant` (`tenant_id`),
  KEY `idx_audit_plano` (`plano_id`),
  KEY `idx_audit_status` (`tenant_id`,`status`),
  KEY `fk_audit_responsavel` (`responsavel_id`),
  KEY `fk_audit_requisito` (`requisito_id`),
  KEY `fk_audit_processo` (`processo_id`),
  CONSTRAINT `fk_audit_plano` FOREIGN KEY (`plano_id`) REFERENCES `planos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_processo` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;