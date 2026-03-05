-- Replica classificações, documentos regulatórios e modelo de seções
-- do tenant 1 para tenants que ainda não possuem documentos regulatórios.

START TRANSACTION;

-- 1) Classificações base por tenant (copiadas por nome, sem duplicar)
INSERT INTO classificacoes (tenant_id, nome)
SELECT t.id AS tenant_id, c1.nome
  FROM tenants t
  JOIN classificacoes c1
    ON c1.tenant_id = 1
  LEFT JOIN classificacoes c2
    ON c2.tenant_id = t.id
   AND c2.nome = c1.nome
 WHERE t.id <> 1
   AND c2.id IS NULL;

-- 2) Documentos regulatórios base por tenant (copiados por nome)
INSERT INTO documentos_regulatorios (
  tenant_id,
  classificacao_id,
  nome,
  sigla,
  descricao,
  base_legal,
  orgao_emissor,
  obrigatoriedade,
  periodicidade,
  impacto,
  exige_responsavel_tecnico,
  exige_assinatura,
  exige_validade,
  ativo
)
SELECT
  t.id AS tenant_id,
  c2.id AS classificacao_id,
  d1.nome,
  d1.sigla,
  d1.descricao,
  d1.base_legal,
  d1.orgao_emissor,
  d1.obrigatoriedade,
  d1.periodicidade,
  d1.impacto,
  d1.exige_responsavel_tecnico,
  d1.exige_assinatura,
  d1.exige_validade,
  d1.ativo
  FROM tenants t
  JOIN documentos_regulatorios d1
    ON d1.tenant_id = 1
  JOIN classificacoes c1
    ON c1.id = d1.classificacao_id
   AND c1.tenant_id = 1
  JOIN classificacoes c2
    ON c2.tenant_id = t.id
   AND c2.nome = c1.nome
  LEFT JOIN documentos_regulatorios d2
    ON d2.tenant_id = t.id
   AND d2.nome = d1.nome
 WHERE t.id <> 1
   AND d2.id IS NULL;

-- 3) Modelo de seções por documento regulatório (cópia por nome + chave)
INSERT INTO documento_modelo_secao (
  tenant_id,
  documento_regulatorio_id,
  chave,
  titulo,
  descricao,
  ordem,
  obrigatoria,
  tipo_input,
  schema_json,
  template_html,
  ativo
)
SELECT
  t.id AS tenant_id,
  d2.id AS documento_regulatorio_id,
  ms1.chave,
  ms1.titulo,
  ms1.descricao,
  ms1.ordem,
  ms1.obrigatoria,
  ms1.tipo_input,
  ms1.schema_json,
  ms1.template_html,
  ms1.ativo
  FROM tenants t
  JOIN documento_modelo_secao ms1
    ON ms1.tenant_id = 1
  JOIN documentos_regulatorios d1
    ON d1.id = ms1.documento_regulatorio_id
   AND d1.tenant_id = 1
  JOIN documentos_regulatorios d2
    ON d2.tenant_id = t.id
   AND d2.nome = d1.nome
  LEFT JOIN documento_modelo_secao ms2
    ON ms2.tenant_id = t.id
   AND ms2.documento_regulatorio_id = d2.id
   AND ms2.chave = ms1.chave
 WHERE t.id <> 1
   AND ms2.id IS NULL;

-- 4) Links das seções (cópia por documento + chave + título + url)
INSERT INTO documento_modelo_secao_links (
  tenant_id,
  modelo_secao_id,
  titulo,
  url
)
SELECT
  t.id AS tenant_id,
  ms2.id AS modelo_secao_id,
  l1.titulo,
  l1.url
  FROM tenants t
  JOIN documento_modelo_secao_links l1
    ON l1.tenant_id = 1
  JOIN documento_modelo_secao ms1
    ON ms1.id = l1.modelo_secao_id
   AND ms1.tenant_id = 1
  JOIN documentos_regulatorios d1
    ON d1.id = ms1.documento_regulatorio_id
   AND d1.tenant_id = 1
  JOIN documentos_regulatorios d2
    ON d2.tenant_id = t.id
   AND d2.nome = d1.nome
  JOIN documento_modelo_secao ms2
    ON ms2.tenant_id = t.id
   AND ms2.documento_regulatorio_id = d2.id
   AND ms2.chave = ms1.chave
  LEFT JOIN documento_modelo_secao_links l2
    ON l2.tenant_id = t.id
   AND l2.modelo_secao_id = ms2.id
   AND l2.titulo = l1.titulo
   AND l2.url = l1.url
 WHERE t.id <> 1
   AND l2.id IS NULL;

COMMIT;
