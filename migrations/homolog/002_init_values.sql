-- Tenants iniciais (homologacao)
INSERT INTO tenants (id, nome)
VALUES
  (1, 'Tenant Demo'),
  (2, 'Tenant 1'),
  (3, 'Tenant 2');

-- Usuarios iniciais do Tenant 1 (homologacao)
-- Gere o bcrypt da senha "Teste@130885" e substitua <HASH_BCRYPT>.
-- Exemplo: node -e "const bcrypt=require('bcrypt'); bcrypt.hash('Teste@130885',10).then(h=>console.log(h))"
INSERT INTO usuarios (tenant_id, nome, email, senha_hash)
VALUES
  (1, 'Admin', 'guisouzabh@gmail.com', '<HASH_BCRYPT>'),
  (1, 'jose', 'zecamora@hotmail.com', '<HASH_BCRYPT>'),
  (1, 'marcia', 'marciayg@gmail.com', '<HASH_BCRYPT>');
