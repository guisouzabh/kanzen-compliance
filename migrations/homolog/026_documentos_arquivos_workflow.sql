ALTER TABLE `documentos_arquivos`
  ADD COLUMN `status` enum('RASCUNHO','APROVADO','REJEITADO','PUBLICADO','ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO' AFTER `tipo_arquivo`,
  ADD COLUMN `motivo_rejeicao` text COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `versao`,
  ADD COLUMN `data_emissao` date DEFAULT NULL AFTER `motivo_rejeicao`,
  ADD COLUMN `data_validade` date DEFAULT NULL AFTER `data_emissao`,
  ADD COLUMN `aprovado_em` datetime DEFAULT NULL AFTER `data_validade`,
  ADD COLUMN `rejeitado_em` datetime DEFAULT NULL AFTER `aprovado_em`,
  ADD COLUMN `publicado_em` datetime DEFAULT NULL AFTER `rejeitado_em`,
  ADD COLUMN `arquivado_em` datetime DEFAULT NULL AFTER `publicado_em`;

UPDATE documentos_arquivos da
JOIN (
  SELECT tenant_id, documento_empresa_id, MAX(id) AS id_mais_recente
    FROM documentos_arquivos
   GROUP BY tenant_id, documento_empresa_id
) ult
  ON ult.tenant_id = da.tenant_id
 AND ult.documento_empresa_id = da.documento_empresa_id
JOIN documentos_empresa de
  ON de.tenant_id = da.tenant_id
 AND de.id = da.documento_empresa_id
SET da.status = CASE
                  WHEN da.id = ult.id_mais_recente AND de.status IN ('VIGENTE', 'VENCIDO') THEN 'PUBLICADO'
                  WHEN da.id <> ult.id_mais_recente AND de.status IN ('VIGENTE', 'VENCIDO') THEN 'ARQUIVADO'
                  WHEN de.status = 'NAO_APLICAVEL' THEN 'ARQUIVADO'
                  ELSE 'RASCUNHO'
                END,
    da.data_emissao = COALESCE(da.data_emissao, de.data_emissao),
    da.data_validade = COALESCE(da.data_validade, de.data_validade),
    da.publicado_em = CASE
                        WHEN da.id = ult.id_mais_recente AND de.status IN ('VIGENTE', 'VENCIDO')
                        THEN COALESCE(da.publicado_em, NOW())
                        ELSE da.publicado_em
                      END,
    da.arquivado_em = CASE
                        WHEN (da.id <> ult.id_mais_recente AND de.status IN ('VIGENTE', 'VENCIDO')) OR de.status = 'NAO_APLICAVEL'
                        THEN COALESCE(da.arquivado_em, NOW())
                        ELSE da.arquivado_em
                      END;

ALTER TABLE `documentos_arquivos`
  ADD COLUMN `publicado_unico` tinyint GENERATED ALWAYS AS (
    CASE WHEN `status` = 'PUBLICADO' THEN 1 ELSE NULL END
  ) STORED;

CREATE UNIQUE INDEX `uk_docarq_publicado_unico`
  ON `documentos_arquivos` (`tenant_id`, `documento_empresa_id`, `publicado_unico`);

CREATE INDEX `idx_docarq_status_validade`
  ON `documentos_arquivos` (`tenant_id`, `status`, `data_validade`);

CREATE INDEX `idx_docarq_status_docemp`
  ON `documentos_arquivos` (`tenant_id`, `documento_empresa_id`, `status`);
