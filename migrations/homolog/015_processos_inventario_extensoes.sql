-- Processos da empresa e novos campos no inventário de dados

CREATE TABLE `processos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_processo_tenant_nome` (`tenant_id`, `nome`),
  KEY `idx_processo_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `inventario_dados`
  ADD COLUMN `dados_sensiveis` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `dados_menor` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `tempo_armazenamento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `local_armazenamento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN `processo_id` int DEFAULT NULL,
  ADD CONSTRAINT `fk_inv_processo` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
