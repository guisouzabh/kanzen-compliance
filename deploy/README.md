# Deploy de producao

## Fase 1: somente landing

Arquitetura desta fase:

- `vanttagem.com.br`: landing page
- `www.vanttagem.com.br`: redireciona para o dominio raiz
- `caddy`: reverse proxy com TLS automatico
- `landing`: app estatico em container

Dica de arquiteto: publicar primeiro a borda publica desacoplada do sistema reduz variaveis. Se DNS, TLS e operacao estiverem corretos agora, a fase 2 vira expansao controlada, nao tentativa e erro.

### 1. DNS na Hostinger

Nesta fase, crie apenas estes registros A:

- `@` -> `109.123.250.98`
- `www` -> `109.123.250.98`

Nao crie `app` ainda se voce quer reduzir superficie e evitar apontamento prematuro.

### 2. Preparar o arquivo de ambiente

No servidor, dentro da pasta `deploy`, crie o arquivo `.env.landing`:

```bash
cp deploy/.env.landing.example deploy/.env.landing
```

Preencha:

- `ACME_EMAIL`: email real para notificacoes do certificado
- `VITE_WHATSAPP_NUMBER`: numero comercial no formato internacional, sem `+`

### 3. Publicar via git pull

Fluxo sugerido para a VPS:

```bash
cd /opt/vanttagem
git clone <SEU_REPOSITORIO> .
cp deploy/.env.landing.example deploy/.env.landing
nano deploy/.env.landing
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml up -d --build
```

Para atualizacoes futuras:

```bash
cd /opt/vanttagem
git pull
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml up -d --build
```

### 4. Validar

Teste:

```bash
curl -I http://vanttagem.com.br
curl -I https://vanttagem.com.br
curl -I https://www.vanttagem.com.br
```

### 5. Operacao

Comandos uteis:

```bash
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml ps
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml logs -f caddy
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml logs -f landing
docker compose --env-file deploy/.env.landing -f deploy/docker-compose.landing.yml up -d --build
```

## Como gerar valores de producao

Para esta fase, voce so precisa de um email valido e do numero de WhatsApp. Mesmo assim, ja te deixo o padrao para a fase 2.

Gerar um segredo forte no Ubuntu:

```bash
openssl rand -base64 48
```

Use esse comando depois para:

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET`
- `ONLYOFFICE_JWT_SECRET`

Regra de arquiteto: cada segredo tem funcao propria. Nunca reutilize a mesma string para banco, JWT e integracoes.

## Fase 2: sistema completo

Arquitetura proposta da fase 2:

- `vanttagem.com.br`: landing page
- `www.vanttagem.com.br`: redireciona para o dominio raiz
- `app.vanttagem.com.br`: sistema web
- `app.vanttagem.com.br/api/v1`: backend
- `db`: MariaDB interno na rede Docker, sem exposicao publica
- `caddy`: reverse proxy com TLS automatico

### DNS na Hostinger

Crie os registros A:

- `@` -> `109.123.250.98`
- `www` -> `109.123.250.98`
- `app` -> `109.123.250.98`

Dica de arquitetura: manter app e API no mesmo host publico reduz CORS, simplifica certificados e corta uma classe inteira de bugs de browser.

### Preparar o arquivo de ambiente

No servidor, dentro da pasta `deploy`, crie o arquivo `.env.production` a partir do exemplo:

```bash
cp deploy/.env.production.example deploy/.env.production
```

Preencha principalmente:

- `ACME_EMAIL`
- `MYSQL_*`
- `DB_*`
- `JWT_SECRET`
- `OPENAI_API_KEY` se o diagnostico com IA estiver habilitado
- `VITE_MAPBOX_TOKEN` se o mapa for usado em producao
- `VITE_WHATSAPP_NUMBER`

### Subir a stack

Na raiz do projeto:

```bash
docker compose \
  --env-file deploy/.env.production \
  -f deploy/docker-compose.prod.yml \
  up -d --build
```

### Validar

Teste estes endpoints:

```bash
curl -I http://vanttagem.com.br
curl -I https://vanttagem.com.br
curl -I https://www.vanttagem.com.br
curl -I https://app.vanttagem.com.br
curl https://app.vanttagem.com.br/healthz
```

### Banco e carga inicial

O compose cria apenas o banco vazio. As tabelas e dados precisam ser carregados separadamente com seu dump ou scripts SQL.

Dica de arquiteto: separar "provisionar infraestrutura" de "migrar dados" evita rollback confuso. Primeiro voce prova que a plataforma sobe; depois injeta schema e dados.

### Operacao

Comandos uteis:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml ps
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml logs -f caddy
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml logs -f api
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml pull
docker compose --env-file deploy/.env.production -f deploy/docker-compose.prod.yml up -d --build
```

### Riscos identificados

- O backend usa `mysql2`, mas existe um `prisma/schema.prisma` apontando para `sqlite`. Hoje isso gera ambiguidade arquitetural e deve ser saneado.
- O projeto local tinha segredo em `.env`. Em producao, mantenha segredos fora do repositorio e rotacione qualquer chave que ja tenha sido exposta.
- O backend ainda nao fecha em `tsc` estrito. Por isso o container da API sobe com `ts-node/register/transpile-only` como ponte operacional. O correto, na proxima etapa, e limpar os erros de tipagem e voltar para build compilado em `dist`.
