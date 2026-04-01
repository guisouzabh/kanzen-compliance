-- Avaliação de Risco LGPD — Matriz 5×5 (ISO 27005 / ISO 31000)

CREATE TABLE `avaliacao_risco` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `inventario_id` int(11) NOT NULL,
  `probabilidade` tinyint(4) NOT NULL COMMENT '0=Raro,1=Improvavel,2=Possivel,3=Provavel,4=Quase_certo',
  `impacto` tinyint(4) NOT NULL COMMENT '0=Insignificante,1=Menor,2=Moderado,3=Maior,4=Catastrofico',
  `nivel_risco` enum('BAIXO','MEDIO','ALTO','CRITICO') NOT NULL,
  `justificativa` text NOT NULL,
  `medidas_mitigatorias` text NOT NULL,
  `responsavel_risco` varchar(255) NOT NULL,
  `avaliado_por_usuario_id` int(11) DEFAULT NULL,
  `versao` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_avaliacao_risco_inventario` (`tenant_id`, `inventario_id`),
  KEY `idx_avaliacao_risco_tenant` (`tenant_id`),
  KEY `idx_avaliacao_risco_nivel` (`tenant_id`, `nivel_risco`),
  KEY `fk_avaliacao_risco_inventario` (`inventario_id`),
  KEY `fk_avaliacao_risco_usuario` (`avaliado_por_usuario_id`),
  CONSTRAINT `fk_avaliacao_risco_inventario` FOREIGN KEY (`inventario_id`) REFERENCES `inventario_dados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_avaliacao_risco_usuario` FOREIGN KEY (`avaliado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `historico_avaliacao_risco` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `avaliacao_risco_id` int(11) NOT NULL,
  `probabilidade_anterior` tinyint(4) NOT NULL,
  `impacto_anterior` tinyint(4) NOT NULL,
  `nivel_risco_anterior` enum('BAIXO','MEDIO','ALTO','CRITICO') NOT NULL,
  `justificativa_anterior` text NOT NULL,
  `medidas_mitigatorias_anterior` text NOT NULL,
  `responsavel_anterior` varchar(255) NOT NULL,
  `alterado_por_usuario_id` int(11) DEFAULT NULL,
  `motivo_alteracao` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hist_avaliacao_tenant` (`tenant_id`),
  KEY `idx_hist_avaliacao_avaliacao` (`avaliacao_risco_id`),
  KEY `fk_hist_avaliacao_usuario` (`alterado_por_usuario_id`),
  CONSTRAINT `fk_hist_avaliacao_avaliacao` FOREIGN KEY (`avaliacao_risco_id`) REFERENCES `avaliacao_risco` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hist_avaliacao_usuario` FOREIGN KEY (`alterado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
