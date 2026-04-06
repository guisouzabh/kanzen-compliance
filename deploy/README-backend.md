# Backend da aplicacao

Objetivo desta etapa:

- manter a landing em `vanttagem.com.br`
- publicar o sistema web em `sistema.vanttagem.com.br`
- manter `app.vanttagem.com.br` como host legado da API, se necessario
- reaproveitar o MariaDB ja criado
- evoluir a stack atual sem criar um segundo proxy na porta `80/443`

Dica de arquiteto: como a landing ja esta no ar com Caddy, o caminho certo e fazer upgrade da mesma borda, e nao subir outro reverse proxy competindo pela mesma porta.

## 1. Preparar o arquivo de ambiente

No servidor, em `~/apps/vanttagem.com.br`:

```bash
cd ~/apps/vanttagem.com.br
cp deploy/.env.backend.example deploy/.env.backend
chmod +x subir-backend.sh atualizar-backend.sh
```

Preencha `deploy/.env.backend` com:

- `ACME_EMAIL`
- `VITE_WHATSAPP_NUMBER`
- `VITE_API_URL`
- `VITE_API_BASE_URL`
- `FRONTEND_URL`
- `DB_PASSWORD`
- `JWT_SECRET`
- `ONLYOFFICE_JWT_SECRET`
- `OPENAI_API_KEY` somente se a feature de IA for usada agora

Gerar segredos:

```bash
openssl rand -base64 48
```

Regra de arquiteto: o `DB_PASSWORD` aqui precisa ser exatamente o mesmo do `MYSQL_PASSWORD` em `deploy/.env.db`, porque a API vai autenticar no banco com o usuario `vanttagem_app`.
Para a landing, fixe `VITE_API_URL=https://app.vanttagem.com.br` durante a transicao ou aponte para `https://sistema.vanttagem.com.br` quando quiser consolidar tudo na mesma borda.
Para o sistema web, use `VITE_API_BASE_URL=/api/v1` e `FRONTEND_URL=https://sistema.vanttagem.com.br`.

## 2. Subir o backend

Comando recomendado:

```bash
cd ~/apps/vanttagem.com.br
./subir-backend.sh
```

Esse script faz:

- derruba a stack antiga da landing para liberar as portas `80/443`
- garante a rede Docker compartilhada `vanttagem_shared`
- reconcilia o container do banco nessa rede
- espera o MariaDB ficar saudavel
- sobe a stack unificada de `landing + frontend + api + caddy`

## 3. Atualizar depois

Depois da primeira publicacao, use:

```bash
cd ~/apps/vanttagem.com.br
./atualizar-backend.sh
```

Esse passa a ser o script oficial da stack completa dessa fase.

## 4. Validar

Teste:

```bash
curl -I https://vanttagem.com.br
curl -I https://sistema.vanttagem.com.br
curl https://sistema.vanttagem.com.br/healthz
curl https://app.vanttagem.com.br/healthz
```

Resultados esperados:

- `vanttagem.com.br` continua servindo a landing
- `sistema.vanttagem.com.br` serve o frontend React
- `sistema.vanttagem.com.br/healthz` retorna `{"status":"ok"}`
- `app.vanttagem.com.br/healthz` continua disponivel como endpoint legado de API

## 5. Observacoes importantes

- O backend continua em modo operacional por `ts-node/register/transpile-only`, porque o projeto ainda nao fecha em `tsc` estrito.
- O sistema agora entra na mesma borda da landing, mas isolado por hostname. Isso preserva um unico ingress e reduz conflitos operacionais.
