-- Seed inicial de secoes para documentos regulatorios LGPD (tenant 1)
-- Idempotente: nao duplica secoes existentes (uk_modelo_secao por chave).

START TRANSACTION;

-- ============================================================
-- Grupo A: Politicas e programas
-- Docs: 1, 2, 8, 13, 16, 18
-- ============================================================
INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'OBJETIVO', 'Objetivo', 'Finalidade e resultado esperado do documento.', 1, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'OBJETIVO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'ESCOPO', 'Escopo', 'Abrangencia organizacional, processos e dados cobertos.', 2, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'ESCOPO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'DIRETRIZES', 'Diretrizes', 'Principios e regras que devem ser seguidos.', 3, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'DIRETRIZES'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'RESPONSABILIDADES', 'Responsabilidades', 'Papeis e responsabilidades das areas envolvidas.', 4, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'RESPONSABILIDADES'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'IMPLEMENTACAO', 'Implementacao', 'Como a politica/programa deve ser colocado em pratica.', 5, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'IMPLEMENTACAO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'CONTROLE_REVISAO', 'Controle e Revisao', 'Periodicidade de revisao, aprovacao e controle de versoes.', 6, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (1,2,8,13,16,18)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'CONTROLE_REVISAO'
   );

-- ============================================================
-- Grupo B: Registros e evidencias
-- Docs: 3, 7, 10, 19
-- ============================================================
INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'FINALIDADE_REGISTRO', 'Finalidade do Registro', 'Objetivo do registro e uso esperado das informacoes.', 1, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'FINALIDADE_REGISTRO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'CRITERIOS_PREENCHIMENTO', 'Criterios de Preenchimento', 'Regras de preenchimento, qualidade e consistencia dos dados.', 2, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'CRITERIOS_PREENCHIMENTO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'ESTRUTURA_DADOS', 'Estrutura de Dados', 'Campos minimos obrigatorios para o registro.', 3, 1, 'JSON',
       '{\"type\":\"object\",\"properties\":{\"campos\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"required\":[\"campos\"]}',
       NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'ESTRUTURA_DADOS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'REGISTROS', 'Registros', 'Conteudo principal dos registros (linhas, eventos ou evidencias).', 4, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'REGISTROS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'RETENCAO_E_GUARDA', 'Retencao e Guarda', 'Prazos de retencao, local de guarda e descarte.', 5, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'RETENCAO_E_GUARDA'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'TRILHA_AUDITORIA', 'Trilha de Auditoria', 'Historico de alteracoes, autor e data/hora.', 6, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (3,7,10,19)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'TRILHA_AUDITORIA'
   );

-- ============================================================
-- Grupo C: Procedimentos e plano de resposta
-- Docs: 6, 9, 17
-- ============================================================
INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'OBJETIVO', 'Objetivo', 'Meta do procedimento/plano e situacoes em que se aplica.', 1, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'OBJETIVO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'GATILHOS', 'Gatilhos e Criterios', 'Eventos que iniciam o procedimento e criterios de acionamento.', 2, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'GATILHOS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'FLUXO_EXECUCAO', 'Fluxo de Execucao', 'Passo a passo operacional do processo.', 3, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'FLUXO_EXECUCAO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'PRAZOS_SLAS', 'Prazos e SLAs', 'Prazos legais e internos para cumprimento das etapas.', 4, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'PRAZOS_SLAS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'EVIDENCIAS', 'Evidencias e Registros', 'Quais evidencias devem ser geradas e armazenadas.', 5, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'EVIDENCIAS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'RESPONSAVEIS', 'Responsaveis', 'Times responsaveis por execucao, aprovacao e monitoramento.', 6, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (6,9,17)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'RESPONSAVEIS'
   );

-- ============================================================
-- Grupo D: Nomeacao, clausulas e acordos
-- Docs: 5, 14, 15
-- ============================================================
INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'PARTES', 'Partes Envolvidas', 'Identificacao das partes e qualificacoes.', 1, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'PARTES'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'OBJETO', 'Objeto', 'Escopo do instrumento juridico e finalidade.', 2, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'OBJETO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'OBRIGACOES', 'Obrigacoes', 'Obrigacoes do controlador, operador e demais partes.', 3, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'OBRIGACOES'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'SEGURANCA_E_PRIVACIDADE', 'Seguranca e Privacidade', 'Controles, confidencialidade e requisitos de protecao de dados.', 4, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'SEGURANCA_E_PRIVACIDADE'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'VIGENCIA', 'Vigencia', 'Prazo de vigencia, revisoes e hipoteses de encerramento.', 5, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'VIGENCIA'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'ASSINATURAS', 'Assinaturas', 'Assinaturas e formalizacoes necessarias.', 6, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (5,14,15)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'ASSINATURAS'
   );

-- ============================================================
-- Grupo E: Matrizes e relatorios
-- Docs: 4, 11, 12, 20
-- ============================================================
INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'OBJETIVO', 'Objetivo', 'Objetivo da avaliacao/consolidacao e publico-alvo.', 1, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'OBJETIVO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'METODOLOGIA', 'Metodologia', 'Criterios, escalas e premissas adotadas.', 2, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'METODOLOGIA'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'ENTRADAS_E_CRITERIOS', 'Entradas e Criterios', 'Dados de entrada, fontes e criterios de avaliacao.', 3, 1, 'JSON',
       '{\"type\":\"object\",\"properties\":{\"fontes\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"criterios\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}',
       NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'ENTRADAS_E_CRITERIOS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'RESULTADOS', 'Resultados', 'Resultados consolidados da analise/matriz.', 4, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'RESULTADOS'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'PLANO_TRATAMENTO', 'Plano de Tratamento', 'Acoes recomendadas, responsaveis e prazos.', 5, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'PLANO_TRATAMENTO'
   );

INSERT INTO documento_modelo_secao
  (tenant_id, documento_regulatorio_id, chave, titulo, descricao, ordem, obrigatoria, tipo_input, schema_json, template_html, ativo)
SELECT dr.tenant_id, dr.id, 'CONCLUSAO_APROVACAO', 'Conclusao e Aprovacao', 'Conclusoes finais, aprovacao e proxima revisao.', 6, 1, 'RICH_TEXT', NULL, NULL, 1
  FROM documentos_regulatorios dr
 WHERE dr.tenant_id = 1
   AND dr.id IN (4,11,12,20)
   AND NOT EXISTS (
     SELECT 1 FROM documento_modelo_secao ms
      WHERE ms.tenant_id = dr.tenant_id AND ms.documento_regulatorio_id = dr.id AND ms.chave = 'CONCLUSAO_APROVACAO'
   );

COMMIT;
