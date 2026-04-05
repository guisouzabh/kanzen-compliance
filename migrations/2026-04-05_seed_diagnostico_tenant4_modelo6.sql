START TRANSACTION;

-- ==========================================================
-- Seed idempotente (producao)
-- Destino: tenant_id = 4, modelo_id = 6
-- Conteudo: 25 perguntas MVP (MVP_01 ... MVP_25)
-- ==========================================================

SET @target_tenant_id := 4;
SET @target_modelo_id := 6;
SET @seed_created_at := '2026-02-14 11:00:33';
SET @seed_updated_at := '2026-02-17 10:57:38';

SET @target_tenant_exists := (
  SELECT COUNT(*)
    FROM tenants
   WHERE id = @target_tenant_id
);

SET @target_model_exists := (
  SELECT COUNT(*)
    FROM diagnostico_modelos
   WHERE id = @target_modelo_id
     AND tenant_id = @target_tenant_id
);

SET @must_fail := IF(@target_tenant_exists = 0, 1, 0);
SET @must_fail := IF(@target_model_exists = 0, 2, @must_fail);

SET @sql_error := CASE
  WHEN @must_fail = 1 THEN 'SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''Tenant destino nao encontrado (tenant_id=4).'';'
  WHEN @must_fail = 2 THEN 'SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''Modelo destino nao encontrado para o tenant (tenant_id=4, modelo_id=6).'';'
  ELSE 'SELECT 1;'
END;

PREPARE stmt FROM @sql_error;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO diagnostico_perguntas (
  tenant_id,
  modelo_id,
  codigo,
  dominio,
  macro_dominio,
  pergunta,
  opcao_0,
  opcao_1,
  opcao_2,
  opcao_3,
  peso,
  ordem,
  ativo,
  created_at,
  updated_at
)
SELECT
  @target_tenant_id,
  @target_modelo_id,
  src.codigo,
  src.dominio,
  src.macro_dominio,
  src.pergunta,
  src.opcao_0,
  src.opcao_1,
  src.opcao_2,
  src.opcao_3,
  src.peso,
  src.ordem,
  src.ativo,
  @seed_created_at,
  @seed_updated_at
FROM (
  SELECT 'MVP_01' AS codigo, 'Governança' AS dominio, 'Governança e Cultura' AS macro_dominio, 'Existe um programa formal de governança em privacidade implementado?' AS pergunta, 'Não existe' AS opcao_0, 'Existe informalmente' AS opcao_1, 'Existe formalizado' AS opcao_2, 'Existe formalizado e monitorado continuamente' AS opcao_3, 3 AS peso, 1 AS ordem, 1 AS ativo
  UNION ALL SELECT 'MVP_02', 'Governança', 'Governança e Cultura', 'Foi indicado Encarregado/DPO com canal público de contato?', 'Não indicado', 'Indicado sem divulgação', 'Indicado e divulgado', 'Indicado com canal ativo e SLA definido', 3, 2, 1
  UNION ALL SELECT 'MVP_03', 'Inventário', 'Inventário e Registro', 'Existe inventário atualizado de dados pessoais tratados?', 'Não existe', 'Existe parcial', 'Existe estruturado', 'Existe estruturado e revisado periodicamente', 3, 3, 1
  UNION ALL SELECT 'MVP_04', 'Dados Sensíveis', 'Dados Sensíveis e Impacto', 'A organização trata dados sensíveis (ex.: saúde)?', 'Não trata', 'Trata sem controle formal', 'Trata com controles básicos', 'Trata com controles reforçados e monitoramento', 3, 4, 1
  UNION ALL SELECT 'MVP_05', 'Base Legal', 'Bases Legais e Transparência', 'As bases legais de cada tratamento estão documentadas?', 'Não documentadas', 'Documentadas parcialmente', 'Documentadas formalmente', 'Documentadas e revisadas periodicamente', 3, 5, 1
  UNION ALL SELECT 'MVP_06', 'Transparência', 'Bases Legais e Transparência', 'Existe política/aviso de privacidade publicado e acessível?', 'Não existe', 'Existe genérico', 'Existe claro e publicado', 'Existe claro, atualizado e acessível', 2, 6, 1
  UNION ALL SELECT 'MVP_07', 'Direitos do Titular', 'Direitos do Titular', 'Existe processo estruturado para atender direitos dos titulares?', 'Não existe', 'Processo informal', 'Processo documentado', 'Processo documentado com controle de prazos', 3, 7, 1
  UNION ALL SELECT 'MVP_08', 'Consentimento', 'Bases Legais e Transparência', 'Quando aplicável, o consentimento é coletado e registrado adequadamente?', 'Não aplicável/Não controlado', 'Controle informal', 'Controle documentado', 'Controle documentado com rastreabilidade', 2, 8, 1
  UNION ALL SELECT 'MVP_09', 'Retenção', 'Inventário e Registro', 'Existe política de retenção e eliminação/anonimização de dados?', 'Não existe', 'Existe parcial', 'Existe formalizada', 'Existe formalizada e aplicada', 2, 9, 1
  UNION ALL SELECT 'MVP_10', 'Contratos', 'Terceiros e Compartilhamento', 'Contratos com operadores contêm cláusulas LGPD adequadas?', 'Não contêm', 'Contêm parcialmente', 'Contêm adequadamente', 'Contêm e são auditados periodicamente', 3, 10, 1
  UNION ALL SELECT 'MVP_11', 'Segurança', 'Segurança e Continuidade', 'Existem medidas técnicas básicas (controle de acesso, backup, logs)?', 'Não existem', 'Existem parcialmente', 'Existem formalizadas', 'Existem formalizadas e monitoradas', 3, 11, 1
  UNION ALL SELECT 'MVP_12', 'Criptografia', 'Segurança e Continuidade', 'Dados sensíveis são protegidos por criptografia ou técnica equivalente?', 'Não protegidos', 'Proteção parcial', 'Proteção adequada', 'Proteção adequada com gestão de chaves', 3, 12, 1
  UNION ALL SELECT 'MVP_13', 'Incidentes', 'Segurança e Continuidade', 'Existe plano de resposta a incidentes com notificação à ANPD?', 'Não existe', 'Existe informal', 'Existe documentado', 'Existe documentado e testado', 3, 13, 1
  UNION ALL SELECT 'MVP_14', 'RIPD', 'Dados Sensíveis e Impacto', 'São realizados Relatórios de Impacto (RIPD/DPIA) quando necessário?', 'Não realizados', 'Realizados informalmente', 'Realizados formalmente', 'Realizados e revisados periodicamente', 3, 14, 1
  UNION ALL SELECT 'MVP_15', 'Privacy by Design', 'Dados Sensíveis e Impacto', 'Novos projetos consideram privacidade desde a concepção?', 'Não consideram', 'Consideram ocasionalmente', 'Consideram formalmente', 'Consideram formalmente com validação', 2, 15, 1
  UNION ALL SELECT 'MVP_16', 'Auditoria', 'Segurança e Continuidade', 'Há registros de logs e trilhas de auditoria de acesso?', 'Não há', 'Há parcialmente', 'Há formalmente', 'Há formalmente com monitoramento ativo', 2, 16, 1
  UNION ALL SELECT 'MVP_17', 'Controle de Acesso', 'Segurança e Continuidade', 'Existe gestão de permissões baseada em função (mínimo privilégio)?', 'Não existe', 'Existe informal', 'Existe formalizada', 'Existe formalizada com revisão periódica', 3, 17, 1
  UNION ALL SELECT 'MVP_18', 'Backups', 'Segurança e Continuidade', 'Existem backups regulares testados e política de restauração?', 'Não existem', 'Existem sem testes', 'Existem com testes', 'Existem com testes e registro formal', 2, 18, 1
  UNION ALL SELECT 'MVP_19', 'Capacitação', 'Governança e Cultura', 'Existe programa contínuo de capacitação em proteção de dados?', 'Não existe', 'Ações pontuais', 'Programa estruturado', 'Programa estruturado com registros e métricas', 1, 19, 1
  UNION ALL SELECT 'MVP_20', 'Compartilhamento', 'Terceiros e Compartilhamento', 'Há controle formal para compartilhamento de dados com terceiros?', 'Não há', 'Controle informal', 'Controle formal documentado', 'Controle formal com auditoria', 2, 20, 1
  UNION ALL SELECT 'MVP_21', 'Supervisão de Operadores', 'Terceiros e Compartilhamento', 'Existem critérios e supervisão de operadores/fornecedores?', 'Não existem', 'Critérios informais', 'Critérios formais', 'Critérios formais com auditoria periódica', 2, 21, 1
  UNION ALL SELECT 'MVP_22', 'Registro de Tratamento', 'Inventário e Registro', 'Existe registro consolidado das operações de tratamento?', 'Não existe', 'Existe parcial', 'Existe formalizado', 'Existe formalizado e atualizado', 2, 22, 1
  UNION ALL SELECT 'MVP_23', 'Auditoria Interna', 'Governança e Cultura', 'São realizadas auditorias internas ou externas de conformidade?', 'Não realizadas', 'Realizadas pontualmente', 'Realizadas formalmente', 'Realizadas periodicamente com plano de ação', 2, 23, 1
  UNION ALL SELECT 'MVP_24', 'Saúde Digital', 'Dados Sensíveis e Impacto', 'Processos de saúde possuem controles adicionais (anonimização, consentimento específico)?', 'Não possuem', 'Possuem parcialmente', 'Possuem formalmente', 'Possuem formalmente e monitorados', 3, 24, 1
  UNION ALL SELECT 'MVP_25', 'Risco Regulatório', 'Governança e Cultura', 'Existe monitoramento contínuo de riscos regulatórios (LGPD/ANPD)?', 'Não existe', 'Monitoramento informal', 'Monitoramento formal', 'Monitoramento formal com indicadores', 3, 25, 1
) src
WHERE NOT EXISTS (
  SELECT 1
    FROM diagnostico_perguntas x
   WHERE x.tenant_id = @target_tenant_id
     AND x.modelo_id = @target_modelo_id
     AND x.codigo = src.codigo
);

COMMIT;

-- Verificacao pos-seed
SELECT tenant_id, modelo_id, COUNT(*) AS total_perguntas
  FROM diagnostico_perguntas
 WHERE tenant_id = @target_tenant_id
   AND modelo_id = @target_modelo_id
 GROUP BY tenant_id, modelo_id;
