-- Categorias de Dados Pessoais e vínculo no inventário

CREATE TABLE `categorias_dados_pessoais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_dado_tenant_nome` (`tenant_id`, `nome`),
  KEY `idx_cat_dado_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `inventario_dados`
  ADD COLUMN `categoria_id` int DEFAULT NULL AFTER `tenant_id`,
  ADD CONSTRAINT `fk_inv_cat_dado` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_dados_pessoais` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
