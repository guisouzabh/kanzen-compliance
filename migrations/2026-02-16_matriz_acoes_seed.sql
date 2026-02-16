START TRANSACTION;

-- Acoes base para cada empresa (seed inicial)
INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Mapear dados pessoais tratados',
       'Criar inventario minimo com categorias, sistemas e bases legais',
       5, 3,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Mapear dados pessoais tratados'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Definir responsavel LGPD',
       'Nomear pessoa responsavel e canal de contato interno',
       4, 2,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Definir responsavel LGPD'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Publicar politica/aviso de privacidade',
       'Garantir transparencia minima para titulares',
       4, 3,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Publicar politica/aviso de privacidade'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Estabelecer canal de direitos do titular',
       'Receber e tratar solicitacoes dentro do prazo legal',
       5, 2,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Estabelecer canal de direitos do titular'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Revisar contratos com operadores/fornecedores',
       'Incluir clausulas de protecao de dados e seguranca',
       4, 4,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Revisar contratos com operadores/fornecedores'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Implementar controles de acesso basicos',
       'Garantir acesso minimo necessario a sistemas com dados pessoais',
       3, 3,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Implementar controles de acesso basicos'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Definir processo de resposta a incidentes',
       'Criar fluxo simples de deteccao, registro e comunicacao',
       4, 3,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Definir processo de resposta a incidentes'
 );

INSERT INTO matriz_acoes (
  tenant_id,
  empresa_id,
  acao,
  objetivo,
  prioridade,
  esforco,
  origem,
  origem_typ
)
SELECT e.tenant_id, e.id,
       'Treinar time em privacidade e seguranca',
       'Orientar colaboradores sobre boas praticas e fluxo de dados',
       3, 2,
       'Seed inicial',
       'BASE'
  FROM empresas e
 WHERE NOT EXISTS (
   SELECT 1
     FROM matriz_acoes a
    WHERE a.tenant_id = e.tenant_id
      AND a.empresa_id = e.id
      AND a.acao = 'Treinar time em privacidade e seguranca'
 );

COMMIT;
