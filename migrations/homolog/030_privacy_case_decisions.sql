ALTER TABLE `privacy_case_incident_details`
  ADD COLUMN `comite_id_decisao` int DEFAULT NULL AFTER `privacy_case_id`,
  ADD KEY `idx_privacy_case_incident_details_comite` (`comite_id_decisao`),
  ADD CONSTRAINT `fk_privacy_case_incident_details_comite`
    FOREIGN KEY (`comite_id_decisao`) REFERENCES `comites` (`id`) ON DELETE SET NULL;

CREATE TABLE `privacy_case_decision_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `privacy_case_id` int NOT NULL,
  `comite_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `aprovado` tinyint(1) NOT NULL DEFAULT '1',
  `decisao_comunicar_anpd` enum('SIM','NAO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decisao_comunicar_titulares` enum('SIM','NAO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justificativa` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_privacy_case_decision_approval_usuario` (`tenant_id`,`privacy_case_id`,`usuario_id`),
  KEY `idx_privacy_case_decision_approval_case` (`tenant_id`,`privacy_case_id`),
  KEY `idx_privacy_case_decision_approval_comite` (`tenant_id`,`comite_id`),
  KEY `idx_privacy_case_decision_approval_usuario` (`tenant_id`,`usuario_id`),
  CONSTRAINT `fk_privacy_case_decision_approval_case` FOREIGN KEY (`privacy_case_id`) REFERENCES `privacy_cases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_privacy_case_decision_approval_comite` FOREIGN KEY (`comite_id`) REFERENCES `comites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_privacy_case_decision_approval_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
