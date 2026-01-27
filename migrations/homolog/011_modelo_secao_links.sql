-- Links úteis por modelo de seção

CREATE TABLE `documento_modelo_secao_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `modelo_secao_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mslink_tenant` (`tenant_id`),
  KEY `idx_mslink_modelo` (`modelo_secao_id`),
  CONSTRAINT `fk_mslink_modelo` FOREIGN KEY (`modelo_secao_id`) REFERENCES `documento_modelo_secao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
