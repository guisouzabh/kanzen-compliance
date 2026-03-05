START TRANSACTION;

RENAME TABLE lgpd_diagnostico_modelos TO diagnostico_modelos,
             lgpd_diagnostico_perguntas TO diagnostico_perguntas,
             lgpd_diagnostico_execucoes TO diagnostico_execucoes,
             lgpd_diagnostico_respostas TO diagnostico_respostas,
             lgpd_diagnostico_resultados_dominio TO diagnostico_resultados_dominio,
             lgpd_diagnostico_resultados_macro TO diagnostico_resultados_macro;

CREATE TABLE IF NOT EXISTS dm_escopo (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  nome varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dm_escopo_tenant_nome (tenant_id, nome),
  KEY idx_dm_escopo_tenant (tenant_id),
  CONSTRAINT fk_dm_escopo_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE diagnostico_modelos
  ADD COLUMN descricao text COLLATE utf8mb4_unicode_ci NULL AFTER nome,
  ADD COLUMN dm_escopo_id int NULL AFTER descricao;

INSERT INTO dm_escopo (tenant_id, nome, descricao)
SELECT t.id, 'LGPD', 'Proteção de dados pessoais e conformidade LGPD'
  FROM tenants t
 WHERE NOT EXISTS (
   SELECT 1 FROM dm_escopo d WHERE d.tenant_id = t.id AND d.nome = 'LGPD'
 );

INSERT INTO dm_escopo (tenant_id, nome, descricao)
SELECT t.id, 'Meio Ambiente', 'Conformidade ambiental e sustentabilidade'
  FROM tenants t
 WHERE NOT EXISTS (
   SELECT 1 FROM dm_escopo d WHERE d.tenant_id = t.id AND d.nome = 'Meio Ambiente'
 );

INSERT INTO dm_escopo (tenant_id, nome, descricao)
SELECT t.id, 'Saúde e Segurança', 'Segurança do trabalho e saúde ocupacional'
  FROM tenants t
 WHERE NOT EXISTS (
   SELECT 1 FROM dm_escopo d WHERE d.tenant_id = t.id AND d.nome = 'Saúde e Segurança'
 );

INSERT INTO dm_escopo (tenant_id, nome, descricao)
SELECT t.id, 'Segurança da Informação', 'Proteção de ativos e segurança da informação'
  FROM tenants t
 WHERE NOT EXISTS (
   SELECT 1 FROM dm_escopo d WHERE d.tenant_id = t.id AND d.nome = 'Segurança da Informação'
 );

UPDATE diagnostico_modelos m
JOIN dm_escopo d
  ON d.tenant_id = m.tenant_id
 AND d.nome = 'LGPD'
   SET m.dm_escopo_id = d.id
 WHERE m.dm_escopo_id IS NULL;

ALTER TABLE diagnostico_modelos
  MODIFY dm_escopo_id int NOT NULL,
  ADD CONSTRAINT fk_diagnostico_modelos_escopo
    FOREIGN KEY (dm_escopo_id) REFERENCES dm_escopo (id) ON DELETE RESTRICT;

COMMIT;
