START TRANSACTION;

ALTER TABLE lgpd_diagnostico_perguntas
  ADD COLUMN macro_dominio varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' AFTER dominio;

ALTER TABLE lgpd_diagnostico_respostas
  ADD COLUMN macro_dominio varchar(100) COLLATE utf8mb4_unicode_ci NULL AFTER dominio;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_resultados_macro (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  execucao_id int NOT NULL,
  macro_dominio varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  nota decimal(5,2) NOT NULL DEFAULT 0,
  total_peso int NOT NULL DEFAULT 0,
  max_pontos int NOT NULL DEFAULT 0,
  pontos decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lgpd_diag_resultado_macro (execucao_id, macro_dominio),
  KEY idx_lgpd_diag_resultado_macro_tenant (tenant_id),
  KEY idx_lgpd_diag_resultado_macro_exec (execucao_id),
  CONSTRAINT fk_lgpd_diag_resultado_macro_exec
    FOREIGN KEY (execucao_id) REFERENCES lgpd_diagnostico_execucoes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE lgpd_diagnostico_perguntas
   SET macro_dominio = CASE
     WHEN dominio IN ('Governança', 'Capacitação', 'Auditoria Interna', 'Risco Regulatório')
       THEN 'Governança e Cultura'
     WHEN dominio IN ('Base Legal', 'Transparência', 'Consentimento')
       THEN 'Bases Legais e Transparência'
     WHEN dominio IN ('Direitos do Titular')
       THEN 'Direitos do Titular'
     WHEN dominio IN ('Inventário', 'Registro de Tratamento', 'Retenção')
       THEN 'Inventário e Registro'
     WHEN dominio IN ('Segurança', 'Criptografia', 'Controle de Acesso', 'Backups', 'Incidentes', 'Auditoria')
       THEN 'Segurança e Continuidade'
     WHEN dominio IN ('Contratos', 'Compartilhamento', 'Supervisão de Operadores')
       THEN 'Terceiros e Compartilhamento'
     WHEN dominio IN ('Dados Sensíveis', 'RIPD', 'Privacy by Design', 'Saúde Digital')
       THEN 'Dados Sensíveis e Impacto'
     ELSE dominio
   END;

UPDATE lgpd_diagnostico_respostas r
JOIN lgpd_diagnostico_perguntas p
  ON p.id = r.pergunta_id AND p.tenant_id = r.tenant_id
   SET r.macro_dominio = p.macro_dominio
 WHERE r.macro_dominio IS NULL OR r.macro_dominio = '';

INSERT INTO lgpd_diagnostico_resultados_macro (
  tenant_id, execucao_id, macro_dominio, nota, total_peso, max_pontos, pontos
)
SELECT
  e.tenant_id,
  e.id AS execucao_id,
  p.macro_dominio,
  CASE
    WHEN SUM(p.peso) > 0 THEN (SUM(COALESCE(r.valor, 0) * p.peso) / (SUM(p.peso) * 3)) * 100
    ELSE 0
  END AS nota,
  SUM(p.peso) AS total_peso,
  SUM(p.peso) * 3 AS max_pontos,
  SUM(COALESCE(r.valor, 0) * p.peso) AS pontos
FROM lgpd_diagnostico_execucoes e
JOIN lgpd_diagnostico_perguntas p
  ON p.tenant_id = e.tenant_id
 AND p.modelo_id = e.modelo_id
 AND p.ativo = 1
LEFT JOIN lgpd_diagnostico_respostas r
  ON r.tenant_id = e.tenant_id
 AND r.execucao_id = e.id
 AND r.pergunta_id = p.id
WHERE e.status = 'FINALIZADO'
GROUP BY e.tenant_id, e.id, p.macro_dominio
ON DUPLICATE KEY UPDATE
  nota = VALUES(nota),
  total_peso = VALUES(total_peso),
  max_pontos = VALUES(max_pontos),
  pontos = VALUES(pontos);

COMMIT;
