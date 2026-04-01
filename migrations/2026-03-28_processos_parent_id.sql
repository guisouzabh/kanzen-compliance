  -- Adiciona suporte a sub-processos via parent_id (self-referencing FK)
  -- Remove o unique constraint antigo e passa a validar unicidade no service

  ALTER TABLE processos
    ADD COLUMN parent_id INT NULL DEFAULT NULL
    AFTER descricao;

  ALTER TABLE processos
    ADD CONSTRAINT fk_processo_parent
    FOREIGN KEY (parent_id) REFERENCES processos(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

  -- Remove o unique constraint (tenant_id, nome) pois o mesmo nome pode
  -- existir em sub-processos de processos diferentes.
  -- A validação de unicidade (tenant_id, parent_id, nome) fica no service.
  ALTER TABLE processos
    DROP INDEX uk_processo_tenant_nome;
