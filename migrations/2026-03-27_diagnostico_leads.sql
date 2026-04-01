CREATE TABLE IF NOT EXISTS diagnostico_leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT          NOT NULL DEFAULT 1,
  nome          VARCHAR(255) NULL,
  email         VARCHAR(255) NOT NULL,
  celular       VARCHAR(50)  NULL,
  empresa       VARCHAR(255) NOT NULL,
  ramo          VARCHAR(255) NULL,
  num_funcionarios VARCHAR(50) NULL,
  cidade        VARCHAR(255) NULL,
  estado        VARCHAR(100) NULL,
  nota_geral    DECIMAL(5,1) NULL,
  resultado_json longtext COLLATE utf8mb4_unicode_ci NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
