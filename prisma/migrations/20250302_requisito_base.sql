-- Cria tabela de requisitos base (sem tenant) e vincula aos requisitos existentes
CREATE TABLE IF NOT EXISTS requisito_base (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tipo ENUM('LEGAL', 'INTERNO', 'EXTERNO') NOT NULL,
  origem ENUM('MUNICIPAL', 'ESTADUAL', 'FEDERAL') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Adiciona referência ao requisito base e modo (ativo/rascunho) nos requisitos
ALTER TABLE requisitos
  ADD COLUMN requisito_base_id BIGINT UNSIGNED NULL AFTER origem,
  ADD COLUMN modo ENUM('ATIVO', 'RASCUNHO') NOT NULL DEFAULT 'RASCUNHO' AFTER requisito_base_id;

-- Popular requisitos_base a partir dos requisitos existentes (usa o mesmo ID para mapear)
INSERT INTO requisito_base (id, titulo, descricao, tipo, origem, created_at, updated_at)
SELECT r.id, r.titulo, r.descricao, r.tipo, r.origem, NOW(), NOW()
  FROM requisitos r
 WHERE NOT EXISTS (
   SELECT 1 FROM requisito_base b WHERE b.id = r.id
 );

-- Ajustar os requisitos para apontar para o requisito_base e modo RASCUNHO
UPDATE requisitos r
   SET r.requisito_base_id = r.id,
       r.modo = 'RASCUNHO'
 WHERE r.requisito_base_id IS NULL;

-- Ajustar AUTO_INCREMENT para continuar após o maior ID copiado
SET @max_id := (SELECT MAX(id) FROM requisito_base);
SET @next_ai := IFNULL(@max_id, 0) + 1;
SET @sql := CONCAT('ALTER TABLE requisito_base AUTO_INCREMENT = ', @next_ai);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tornar a FK obrigatória após preenchimento
ALTER TABLE requisitos
  MODIFY COLUMN requisito_base_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_requisitos_base FOREIGN KEY (requisito_base_id) REFERENCES requisito_base(id);
