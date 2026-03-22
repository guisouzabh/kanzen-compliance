# Banco de dados MariaDB

Objetivo desta etapa:

- subir o MariaDB em container
- persistir dados em volume Docker fixo
- expor a porta `3306`
- permitir acesso externo somente do IP `177.182.222.161`
- preparar usuario da aplicacao e usuario administrativo para DBeaver

Dica de arquiteto: acesso externo a banco sem TLS funciona, mas nao e o desenho mais seguro da internet aberta. Para maturidade maior, a evolucao correta e usar SSH tunnel no DBeaver e manter a porta `3306` fechada publicamente.

## 1. Preparar ambiente

No servidor, em `~/apps/vanttagem.com.br`:

```bash
cd ~/apps/vanttagem.com.br
cp deploy/.env.db.example deploy/.env.db
chmod +x subir-banco.sh atualizar-acesso-db.sh
```

Edite `deploy/.env.db` e preencha:

- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_ADMIN_PASSWORD`
- `DB_ALLOWED_IP`

Gerar senhas fortes:

```bash
openssl rand -base64 48
```

Sugestao inicial:

```env
COMPOSE_PROJECT_NAME=vanttagem-db
MYSQL_DATABASE=vanttagem
MYSQL_USER=vanttagem_app
MYSQL_PASSWORD=troque-app-password
MYSQL_ROOT_PASSWORD=troque-root-password
MYSQL_ADMIN_USER=vanttagem_admin
MYSQL_ADMIN_PASSWORD=troque-admin-password
DB_PUBLIC_PORT=3306
DB_ALLOWED_IP=177.182.222.161
```

## 2. Subir o banco

Comando recomendado:

```bash
cd ~/apps/vanttagem.com.br
./subir-banco.sh
```

Se quiser informar outro IP na hora:

```bash
cd ~/apps/vanttagem.com.br
./subir-banco.sh 177.182.222.161
```

O script faz:

- sobe o container do MariaDB
- espera o banco ficar saudavel
- cria o database `vanttagem`
- garante o usuario `vanttagem_app` para a aplicacao
- aplica a regra local do UFW para `3306`
- cria ou atualiza o usuario `vanttagem_admin` restrito ao seu IP

## 3. Atualizar o IP permitido no futuro

Como seu IP pode mudar a cada 30 dias, quando isso acontecer:

1. atualize `DB_ALLOWED_IP` em `deploy/.env.db`
2. rode:

```bash
cd ~/apps/vanttagem.com.br
./atualizar-acesso-db.sh
```

Ou informe o IP explicitamente:

```bash
cd ~/apps/vanttagem.com.br
./atualizar-acesso-db.sh 177.182.222.161
```

Esse script:

- remove a regra antiga do UFW para `3306`
- cria a nova regra local para o IP atual
- remove hosts antigos do usuario `vanttagem_admin`
- recria o acesso administrativo apenas para o IP atual

## 4. Firewall externo da Contabo

Voce precisa replicar a mesma regra no firewall externo da VPS.

Use estes valores:

- acao: `Allow`
- protocolo: `TCP`
- porta destino: `3306`
- origem: `SEU_IP_ATUAL/32`
- descricao: `vanttagem-db-dbeaver`

Quando seu IP mudar, atualize essa regra na Contabo tambem.

## 5. DBeaver

Configuracao:

- Host: `109.123.250.98`
- Porta: `3306`
- Database: `vanttagem`
- Usuario: `vanttagem_admin`
- Senha: valor de `MYSQL_ADMIN_PASSWORD`

## 6. Comandos de operacao

Ver status:

```bash
cd ~/apps/vanttagem.com.br
docker compose --env-file deploy/.env.db -f deploy/docker-compose.db.yml ps
```

Ver logs:

```bash
cd ~/apps/vanttagem.com.br
docker compose --env-file deploy/.env.db -f deploy/docker-compose.db.yml logs -f db
```

Parar:

```bash
cd ~/apps/vanttagem.com.br
docker compose --env-file deploy/.env.db -f deploy/docker-compose.db.yml stop
```

Subir novamente:

```bash
cd ~/apps/vanttagem.com.br
docker compose --env-file deploy/.env.db -f deploy/docker-compose.db.yml up -d
```

## 7. Fase 2

O volume do banco foi nomeado como `vanttagem_mariadb_data`, entao a stack completa da fase 2 pode reaproveitar a mesma base sem perder dados.
