-- Seed: insere sub-processos para processos já cadastrados com nomes comuns
-- Só insere se o processo pai existir e o sub-processo ainda não existir
-- Suporta variações de capitalização via LOWER()

START TRANSACTION;

-- ============================================================
-- FINANCEIRO / FINANCEIRA
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Contas a Pagar'             AS nome UNION ALL
  SELECT 'Contas a Receber'           UNION ALL
  SELECT 'Folha de Pagamento'         UNION ALL
  SELECT 'Conciliação Bancária'       UNION ALL
  SELECT 'Planejamento Orçamentário'  UNION ALL
  SELECT 'Controle de Despesas'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('financeiro', 'financeira', 'financeiro/contábil', 'contabilidade')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- COMPRAS / SUPRIMENTOS
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Solicitação de Compra'      AS nome UNION ALL
  SELECT 'Cotação de Fornecedores'    UNION ALL
  SELECT 'Aprovação de Compra'        UNION ALL
  SELECT 'Recebimento de Mercadorias' UNION ALL
  SELECT 'Cadastro de Fornecedores'   UNION ALL
  SELECT 'Gestão de Contratos'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('compras', 'suprimentos', 'compras e suprimentos', 'procurement')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- RH / RECURSOS HUMANOS / PESSOAS
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Recrutamento e Seleção'     AS nome UNION ALL
  SELECT 'Admissão'                   UNION ALL
  SELECT 'Desligamento'               UNION ALL
  SELECT 'Avaliação de Desempenho'    UNION ALL
  SELECT 'Treinamento e Capacitação'  UNION ALL
  SELECT 'Benefícios'                 UNION ALL
  SELECT 'Medicina e Segurança do Trabalho'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('rh', 'recursos humanos', 'pessoas', 'gestão de pessoas', 'dp', 'departamento pessoal')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- TI / TECNOLOGIA / TECNOLOGIA DA INFORMAÇÃO
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Gestão de Acessos'          AS nome UNION ALL
  SELECT 'Backup e Recuperação'       UNION ALL
  SELECT 'Suporte Técnico'            UNION ALL
  SELECT 'Desenvolvimento de Sistemas' UNION ALL
  SELECT 'Segurança da Informação'    UNION ALL
  SELECT 'Gestão de Infraestrutura'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('ti', 'tecnologia', 'tecnologia da informação', 'tic', 'sistemas')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- JURÍDICO / LEGAL
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Contratos'                  AS nome UNION ALL
  SELECT 'Compliance'                 UNION ALL
  SELECT 'Litígios e Defesas'         UNION ALL
  SELECT 'Propriedade Intelectual'    UNION ALL
  SELECT 'Regulatório'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('jurídico', 'juridico', 'legal', 'jurídico/compliance')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- MARKETING / COMUNICAÇÃO
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Gestão de Campanhas'        AS nome UNION ALL
  SELECT 'Comunicação Digital'        UNION ALL
  SELECT 'Relacionamento com Cliente' UNION ALL
  SELECT 'Branding'                   UNION ALL
  SELECT 'Eventos'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('marketing', 'comunicação', 'comunicacao', 'marketing e comunicação')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- VENDAS / COMERCIAL
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Prospecção de Clientes'     AS nome UNION ALL
  SELECT 'Proposta Comercial'         UNION ALL
  SELECT 'Negociação e Fechamento'    UNION ALL
  SELECT 'Pós-Venda'                  UNION ALL
  SELECT 'Gestão de Carteira'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('vendas', 'comercial', 'vendas e marketing', 'comercial/vendas')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

-- ============================================================
-- OPERAÇÕES / PRODUÇÃO / LOGÍSTICA
-- ============================================================
INSERT INTO processos (tenant_id, nome, parent_id)
SELECT p.tenant_id, sub.nome, p.id
FROM processos p
JOIN (
  SELECT 'Planejamento e Controle'    AS nome UNION ALL
  SELECT 'Gestão de Estoque'          UNION ALL
  SELECT 'Controle de Qualidade'      UNION ALL
  SELECT 'Logística e Distribuição'   UNION ALL
  SELECT 'Manutenção'
) sub ON 1=1
WHERE LOWER(p.nome) IN ('operações', 'operacoes', 'produção', 'producao', 'logística', 'logistica', 'operações e logística')
  AND p.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM processos x
     WHERE x.tenant_id = p.tenant_id
       AND x.parent_id = p.id
       AND LOWER(x.nome) = LOWER(sub.nome)
  );

COMMIT;
