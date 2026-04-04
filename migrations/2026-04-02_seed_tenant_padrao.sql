START TRANSACTION;

-- ==========================================================
-- Seed idempotente para onboarding de tenant padrao em producao
-- ==========================================================
-- Tenant: Tenant Padrao
-- Estrutura: 1 matriz + 2 filiais
-- Usuarios: guilherme e mariathereza
-- ==========================================================

INSERT INTO tenants (nome)
SELECT 'Tenant Padrao'
WHERE NOT EXISTS (
  SELECT 1 FROM tenants WHERE nome = 'Tenant Padrao'
);

SET @tenant_padrao_id := (
  SELECT id
    FROM tenants
   WHERE nome = 'Tenant Padrao'
   ORDER BY id ASC
   LIMIT 1
);

-- Empresa matriz
INSERT INTO empresas (
  tenant_id,
  nome,
  cnpj,
  matriz_ou_filial,
  razao_social,
  cep,
  endereco,
  cidade,
  estado
)
SELECT
  @tenant_padrao_id,
  'Tenant Padrao Matriz',
  '11.111.111/0001-11',
  'MATRIZ',
  'Tenant Padrao Matriz LTDA',
  '01000-000',
  'Endereco matriz - ajustar em producao',
  'Sao Paulo',
  'SP'
WHERE @tenant_padrao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM empresas
     WHERE tenant_id = @tenant_padrao_id
       AND cnpj = '11.111.111/0001-11'
  );

-- Filial 1
INSERT INTO empresas (
  tenant_id,
  nome,
  cnpj,
  matriz_ou_filial,
  razao_social,
  cep,
  endereco,
  cidade,
  estado
)
SELECT
  @tenant_padrao_id,
  'Tenant Padrao Filial 01',
  '11.111.111/0002-00',
  'FILIAL',
  'Tenant Padrao Filial 01 LTDA',
  '20000-000',
  'Endereco filial 01 - ajustar em producao',
  'Rio de Janeiro',
  'RJ'
WHERE @tenant_padrao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM empresas
     WHERE tenant_id = @tenant_padrao_id
       AND cnpj = '11.111.111/0002-00'
  );

-- Filial 2
INSERT INTO empresas (
  tenant_id,
  nome,
  cnpj,
  matriz_ou_filial,
  razao_social,
  cep,
  endereco,
  cidade,
  estado
)
SELECT
  @tenant_padrao_id,
  'Tenant Padrao Filial 02',
  '11.111.111/0003-99',
  'FILIAL',
  'Tenant Padrao Filial 02 LTDA',
  '30000-000',
  'Endereco filial 02 - ajustar em producao',
  'Belo Horizonte',
  'MG'
WHERE @tenant_padrao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM empresas
     WHERE tenant_id = @tenant_padrao_id
       AND cnpj = '11.111.111/0003-99'
  );

SET @empresa_matriz_id := (
  SELECT id
    FROM empresas
   WHERE tenant_id = @tenant_padrao_id
     AND cnpj = '11.111.111/0001-11'
   ORDER BY id ASC
   LIMIT 1
);

-- Hashes bcrypt de senhas temporarias:
-- guilherme: Kanzen@2026!Onboard#1
-- mariathereza: Kanzen@2026!Onboard#2
SET @hash_guilherme := '$2b$10$7xZJb843ZWNyTuCt2F56ruRYczbIYEXlF40aqRyqPcXpkCBkPd1v2';
SET @hash_mariathereza := '$2b$10$ax4Q9/ehcGTm3Aa0nl0eC.g.GNlLqQrE9sJL4lr.ACMDIIo4a8UdO';

INSERT INTO usuarios (
  tenant_id,
  nome,
  email,
  senha_hash,
  empresa_id,
  role
)
SELECT
  @tenant_padrao_id,
  'guilherme',
  'guisouzabh@gmail.com',
  @hash_guilherme,
  @empresa_matriz_id,
  'GESTOR'
WHERE @tenant_padrao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM usuarios
     WHERE email = 'guisouzabh@gmail.com'
  );

INSERT INTO usuarios (
  tenant_id,
  nome,
  email,
  senha_hash,
  empresa_id,
  role
)
SELECT
  @tenant_padrao_id,
  'mariathereza',
  'mariatherezaalmeida@gmail.com',
  @hash_mariathereza,
  @empresa_matriz_id,
  'COLABORADOR'
WHERE @tenant_padrao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM usuarios
     WHERE email = 'mariatherezaalmeida@gmail.com'
  );

-- Se o usuario ja existir no mesmo tenant, garante dados basicos
UPDATE usuarios
   SET nome = 'guilherme',
       empresa_id = @empresa_matriz_id,
       role = 'GESTOR'
 WHERE email = 'guisouzabh@gmail.com'
   AND tenant_id = @tenant_padrao_id;

UPDATE usuarios
   SET nome = 'mariathereza',
       empresa_id = @empresa_matriz_id,
       role = 'COLABORADOR'
 WHERE email = 'mariatherezaalmeida@gmail.com'
   AND tenant_id = @tenant_padrao_id;

COMMIT;

-- Verificacoes rapidas pos-seed
SELECT id, nome
  FROM tenants
 WHERE id = @tenant_padrao_id;

SELECT id, nome, cnpj, matriz_ou_filial
  FROM empresas
 WHERE tenant_id = @tenant_padrao_id
 ORDER BY matriz_ou_filial DESC, id ASC;

SELECT id, nome, email, role, tenant_id, empresa_id
  FROM usuarios
 WHERE email IN ('guisouzabh@gmail.com', 'mariatherezaalmeida@gmail.com')
 ORDER BY id ASC;
