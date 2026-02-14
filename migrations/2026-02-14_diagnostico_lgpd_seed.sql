START TRANSACTION;

INSERT INTO lgpd_diagnostico_modelos (tenant_id, nome, versao, ativo)
SELECT t.id, 'Diagnóstico LGPD - MVP', 1, 1
  FROM tenants t
 WHERE NOT EXISTS (
   SELECT 1
     FROM lgpd_diagnostico_modelos m
    WHERE m.tenant_id = t.id
      AND m.nome = 'Diagnóstico LGPD - MVP'
 );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_01', 'Governança',
       'Existe um programa formal de governança em privacidade implementado?',
       'Não existe', 'Existe informalmente', 'Existe formalizado',
       'Existe formalizado e monitorado continuamente',
       3, 1, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_01'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_02', 'Governança',
       'Foi indicado Encarregado/DPO com canal público de contato?',
       'Não indicado', 'Indicado sem divulgação', 'Indicado e divulgado',
       'Indicado com canal ativo e SLA definido',
       3, 2, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_02'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_03', 'Inventário',
       'Existe inventário atualizado de dados pessoais tratados?',
       'Não existe', 'Existe parcial', 'Existe estruturado',
       'Existe estruturado e revisado periodicamente',
       3, 3, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_03'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_04', 'Dados Sensíveis',
       'A organização trata dados sensíveis (ex.: saúde)?',
       'Não trata', 'Trata sem controle formal', 'Trata com controles básicos',
       'Trata com controles reforçados e monitoramento',
       3, 4, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_04'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_05', 'Base Legal',
       'As bases legais de cada tratamento estão documentadas?',
       'Não documentadas', 'Documentadas parcialmente', 'Documentadas formalmente',
       'Documentadas e revisadas periodicamente',
       3, 5, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_05'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_06', 'Transparência',
       'Existe política/aviso de privacidade publicado e acessível?',
       'Não existe', 'Existe genérico', 'Existe claro e publicado',
       'Existe claro, atualizado e acessível',
       2, 6, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_06'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_07', 'Direitos do Titular',
       'Existe processo estruturado para atender direitos dos titulares?',
       'Não existe', 'Processo informal', 'Processo documentado',
       'Processo documentado com controle de prazos',
       3, 7, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_07'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_08', 'Consentimento',
       'Quando aplicável, o consentimento é coletado e registrado adequadamente?',
       'Não aplicável/Não controlado', 'Controle informal', 'Controle documentado',
       'Controle documentado com rastreabilidade',
       2, 8, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_08'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_09', 'Retenção',
       'Existe política de retenção e eliminação/anonimização de dados?',
       'Não existe', 'Existe parcial', 'Existe formalizada',
       'Existe formalizada e aplicada',
       2, 9, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_09'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_10', 'Contratos',
       'Contratos com operadores contêm cláusulas LGPD adequadas?',
       'Não contêm', 'Contêm parcialmente', 'Contêm adequadamente',
       'Contêm e são auditados periodicamente',
       3, 10, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_10'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_11', 'Segurança',
       'Existem medidas técnicas básicas (controle de acesso, backup, logs)?',
       'Não existem', 'Existem parcialmente', 'Existem formalizadas',
       'Existem formalizadas e monitoradas',
       3, 11, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_11'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_12', 'Criptografia',
       'Dados sensíveis são protegidos por criptografia ou técnica equivalente?',
       'Não protegidos', 'Proteção parcial', 'Proteção adequada',
       'Proteção adequada com gestão de chaves',
       3, 12, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_12'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_13', 'Incidentes',
       'Existe plano de resposta a incidentes com notificação à ANPD?',
       'Não existe', 'Existe informal', 'Existe documentado',
       'Existe documentado e testado',
       3, 13, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_13'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_14', 'RIPD',
       'São realizados Relatórios de Impacto (RIPD/DPIA) quando necessário?',
       'Não realizados', 'Realizados informalmente', 'Realizados formalmente',
       'Realizados e revisados periodicamente',
       3, 14, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_14'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_15', 'Privacy by Design',
       'Novos projetos consideram privacidade desde a concepção?',
       'Não consideram', 'Consideram ocasionalmente', 'Consideram formalmente',
       'Consideram formalmente com validação',
       2, 15, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_15'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_16', 'Auditoria',
       'Há registros de logs e trilhas de auditoria de acesso?',
       'Não há', 'Há parcialmente', 'Há formalmente',
       'Há formalmente com monitoramento ativo',
       2, 16, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_16'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_17', 'Controle de Acesso',
       'Existe gestão de permissões baseada em função (mínimo privilégio)?',
       'Não existe', 'Existe informal', 'Existe formalizada',
       'Existe formalizada com revisão periódica',
       3, 17, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_17'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_18', 'Backups',
       'Existem backups regulares testados e política de restauração?',
       'Não existem', 'Existem sem testes', 'Existem com testes',
       'Existem com testes e registro formal',
       2, 18, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_18'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_19', 'Capacitação',
       'Existe programa contínuo de capacitação em proteção de dados?',
       'Não existe', 'Ações pontuais', 'Programa estruturado',
       'Programa estruturado com registros e métricas',
       1, 19, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_19'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_20', 'Compartilhamento',
       'Há controle formal para compartilhamento de dados com terceiros?',
       'Não há', 'Controle informal', 'Controle formal documentado',
       'Controle formal com auditoria',
       2, 20, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_20'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_21', 'Supervisão de Operadores',
       'Existem critérios e supervisão de operadores/fornecedores?',
       'Não existem', 'Critérios informais', 'Critérios formais',
       'Critérios formais com auditoria periódica',
       2, 21, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_21'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_22', 'Registro de Tratamento',
       'Existe registro consolidado das operações de tratamento?',
       'Não existe', 'Existe parcial', 'Existe formalizado',
       'Existe formalizado e atualizado',
       2, 22, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_22'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_23', 'Auditoria Interna',
       'São realizadas auditorias internas ou externas de conformidade?',
       'Não realizadas', 'Realizadas pontualmente', 'Realizadas formalmente',
       'Realizadas periodicamente com plano de ação',
       2, 23, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_23'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_24', 'Saúde Digital',
       'Processos de saúde possuem controles adicionais (anonimização, consentimento específico)?',
       'Não possuem', 'Possuem parcialmente', 'Possuem formalmente',
       'Possuem formalmente e monitorados',
       3, 24, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_24'
   );

INSERT INTO lgpd_diagnostico_perguntas (
  tenant_id, modelo_id, codigo, dominio, pergunta,
  opcao_0, opcao_1, opcao_2, opcao_3,
  peso, ordem, ativo
)
SELECT m.tenant_id, m.id, 'MVP_25', 'Risco Regulatório',
       'Existe monitoramento contínuo de riscos regulatórios (LGPD/ANPD)?',
       'Não existe', 'Monitoramento informal', 'Monitoramento formal',
       'Monitoramento formal com indicadores',
       3, 25, 1
  FROM lgpd_diagnostico_modelos m
 WHERE m.nome = 'Diagnóstico LGPD - MVP'
   AND NOT EXISTS (
     SELECT 1 FROM lgpd_diagnostico_perguntas p
      WHERE p.modelo_id = m.id AND p.codigo = 'MVP_25'
   );

COMMIT;
