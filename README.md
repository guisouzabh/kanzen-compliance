# kanzen-compliance

## Tabelas novas (MySQL)
```sql
CREATE TABLE requisitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tipo ENUM('LEGAL', 'INTERNO', 'EXTERNO') NOT NULL,
  status ENUM('CONFORME', 'NAO_CONFORME', 'EM_ANALISE', 'SEM_ANALISE', 'EM_REANALISE') NOT NULL,
  origem ENUM('MUNICIPAL', 'ESTADUAL', 'FEDERAL') NOT NULL,
  area_responsavel_id INT NOT NULL,
  usuario_responsavel_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_requisitos_tenant (tenant_id)
);
-- FKs: area_responsavel_id -> areas(id) ON DELETE RESTRICT, usuario_responsavel_id -> usuarios(id) ON DELETE SET NULL

-- Migração a partir do modelo antigo:
-- ALTER TABLE requisitos
--   ADD COLUMN area_responsavel_id INT NOT NULL AFTER origem,
--   ADD COLUMN usuario_responsavel_id INT NULL AFTER area_responsavel_id,
--   DROP COLUMN responsavel;

CREATE TABLE requisito_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  requisito_id INT NOT NULL,
  descricao TEXT NOT NULL,
  data DATETIME NOT NULL,
  responsavel VARCHAR(255) NOT NULL,
  anexo VARCHAR(255),
  status ENUM('CONFORME', 'NAO_CONFORME', 'EM_ANALISE', 'SEM_ANALISE', 'EM_REANALISE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkin_tenant (tenant_id),
  CONSTRAINT fk_checkin_requisito
    FOREIGN KEY (requisito_id) REFERENCES requisitos(id)
    ON DELETE CASCADE
);

CREATE TABLE requisito_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  requisito_id INT NOT NULL,
  tag VARCHAR(100) NOT NULL,
  INDEX idx_tags_tenant (tenant_id),
  CONSTRAINT fk_tag_requisito
    FOREIGN KEY (requisito_id) REFERENCES requisitos(id)
    ON DELETE CASCADE
);

CREATE TABLE requisito_outras_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  requisito_id INT NOT NULL,
  area_id INT NOT NULL,
  INDEX idx_outras_areas_tenant (tenant_id),
  CONSTRAINT fk_outras_area_requisito
    FOREIGN KEY (requisito_id) REFERENCES requisitos(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_outras_area_area
    FOREIGN KEY (area_id) REFERENCES areas(id)
    ON DELETE CASCADE
);

CREATE TABLE classificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_classificacoes_tenant (tenant_id)
);

-- Ajuste em requisitos para classificação
ALTER TABLE requisitos
  ADD COLUMN classificacao_id INT NOT NULL DEFAULT 0 AFTER origem,
  ADD CONSTRAINT fk_requisito_classificacao FOREIGN KEY (classificacao_id) REFERENCES classificacoes(id) ON DELETE RESTRICT;

-- Para dados existentes, criar a classificação padrão e atribuir:
-- INSERT INTO classificacoes (tenant_id, nome) SELECT DISTINCT tenant_id, 'Premios e Apostas' FROM requisitos;
-- UPDATE requisitos r
-- JOIN classificacoes c ON c.tenant_id = r.tenant_id AND c.nome = 'Premios e Apostas'
-- SET r.classificacao_id = c.id
-- WHERE r.classificacao_id = 0;

-- Tarefas por requisito
CREATE TABLE requisito_tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  requisito_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  responsavel_id INT NULL,
  status ENUM('ABERTO', 'FECHADO') NOT NULL DEFAULT 'ABERTO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tarefas_tenant (tenant_id),
  CONSTRAINT fk_tarefa_requisito FOREIGN KEY (requisito_id) REFERENCES requisitos(id) ON DELETE CASCADE,
  CONSTRAINT fk_tarefa_usuario FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Áreas vinculadas a empresas
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_areas_tenant (tenant_id),
  CONSTRAINT fk_area_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE CASCADE
);

-- Vínculo opcional de usuário com empresa/área
ALTER TABLE usuarios
  ADD COLUMN empresa_id INT NULL,
  ADD COLUMN area_id INT NULL,
  ADD INDEX idx_usuario_empresa (empresa_id),
  ADD INDEX idx_usuario_area (area_id),
  ADD CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_usuario_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;

-- Listagem/criação de usuários por tenant: use as rotas autenticadas /api/v1/usuarios (GET/POST)
```

Para bases existentes antes da inclusão do mapa de requisitos, adicione latitude/longitude em `areas`:

```sql
ALTER TABLE areas
  ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER descricao,
  ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;
```
