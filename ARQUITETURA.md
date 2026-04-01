# Arquitetura do Projeto — Vanttagem LGPD

Sistema de compliance LGPD multi-tenant. Três camadas independentes: **backend** (API REST), **rlk-front** (sistema principal, exige login) e **landing-front** (página pública de captação).

---

## Backend (`src/`)

### Stack
- **Runtime**: Node.js + Express + TypeScript
- **Banco**: MariaDB via `mysql2` (pool de conexões em `src/config/db.ts`)
- **Validação**: Zod
- **Autenticação**: JWT (Bearer token)
- **Logger HTTP**: Morgan

### Estrutura de diretórios

```
src/
├── index.ts                  # Entry point — registra rotas e middlewares
├── routes/                   # Definição de rotas por recurso
├── controllers/              # Recebe req/res, valida com Zod, chama service
├── services/                 # Lógica de negócio e acesso ao banco
├── types/                    # Interfaces TypeScript dos domínios
├── validation/               # Schemas Zod por recurso
├── middleware/
│   ├── authMiddleware.ts     # Valida JWT, popula req.usuario
│   └── errorHandler.ts       # Captura AppError e erros não tratados
├── errors/
│   └── AppError.ts           # Erro customizado com statusCode
├── db/
│   └── tenantDb.ts           # Helpers tenantQuery / tenantExecute
└── utils/
    └── asyncHandler.ts       # Wrapper para capturar erros em controllers async
```

### Multi-tenancy

Cada requisição autenticada carrega `tenantId` no JWT. Toda query ao banco **obrigatoriamente** filtra por tenant usando os helpers:

```ts
// src/db/tenantDb.ts

// A primeira ? do SQL é SEMPRE tenant_id
tenantQuery(tenantId, 'SELECT * FROM tabela WHERE tenant_id = ?')
tenantExecute(tenantId, 'INSERT INTO tabela (tenant_id, ...) VALUES (?, ...)', [...params])
```

Nunca use `pool.query` diretamente em services — use sempre `tenantQuery` ou `tenantExecute`.

### Autenticação e `req.usuario`

O `authMiddleware` verifica o Bearer token e popula `req.usuario`:

```ts
interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    nome: string;
    fotoUrl?: string | null;
    tenantId: number;
    empresaId?: number | null;
    areaId?: number | null;
    role?: UserRole; // 'ADMIN_MESTRE' | 'ADMIN' | 'USUARIO' | 'USUARIO_TAREFA'
  };
}
```

### Padrão de rotas

Todas as rotas seguem o prefixo `/api/v1`. Rotas **públicas** (sem autenticação) ficam antes das protegidas em `src/index.ts`:

```ts
// Públicas
app.use('/api/v1', authRoutes);           // POST /api/v1/login
app.use('/api/v1', diagnosticoPublicoRoutes); // POST /api/v1/diagnostico-publico

// Protegidas (authMiddleware aplicado dentro do router)
app.use('/api/v1', empresaRoutes);
app.use('/api/v1', requisitoRoutes);
// ...demais recursos
```

Dentro do arquivo de rotas, `authMiddleware` é aplicado com `router.use(authMiddleware)` no topo, protegendo todos os endpoints abaixo:

```ts
const router = Router();
router.use(authMiddleware);

router.get('/requisitos',           asyncHandler(listarRequisitos));
router.post('/requisitos',          asyncHandler(criarRequisito));
router.get('/requisitos/:id',       asyncHandler(obterRequisito));
router.put('/requisitos/:id',       asyncHandler(atualizarRequisito));
router.delete('/requisitos/:id',    asyncHandler(deletarRequisito));

// Sub-recursos aninhados
router.get('/requisitos/:id/checkins',  asyncHandler(listarCheckins));
router.post('/requisitos/:id/checkins', asyncHandler(criarCheckin));
```

Convenções de endpoints:
| Método | Caminho             | Ação                  |
|--------|---------------------|-----------------------|
| GET    | `/recurso`          | Listar (do tenant)    |
| POST   | `/recurso`          | Criar                 |
| GET    | `/recurso/:id`      | Obter por ID          |
| PUT    | `/recurso/:id`      | Atualizar completo    |
| DELETE | `/recurso/:id`      | Deletar               |
| GET    | `/recurso/:id/sub`  | Listar sub-recurso    |
| POST   | `/recurso/:id/sub`  | Criar sub-recurso     |

### Validação com Zod

Cada recurso tem um schema em `src/validation/`. O controller chama `safeParse` e retorna 400 em caso de falha:

```ts
// src/validation/empresaSchema.ts
export const empresaSchema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().min(14).max(18),
  // ...
});
export type EmpresaInput = z.infer<typeof empresaSchema>;

// src/controllers/empresaController.ts
const parseResult = empresaSchema.safeParse(req.body);
if (!parseResult.success) {
  return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
}
const dados: EmpresaInput = parseResult.data;
```

Nunca acesse `req.body` diretamente sem passar pelo schema Zod.

### Tratamento de erros

- `AppError(mensagem, statusCode)` — erros de negócio esperados (404, 400, 401, 403)
- `asyncHandler(fn)` — envolve cada controller para capturar exceções async e encaminhar ao `errorHandler`
- `errorHandler` (último middleware em `index.ts`) — formata a resposta de erro

### Camada de serviços

Services recebem `tenantId` e `dados` tipados, executam SQL via `tenantQuery`/`tenantExecute`, e retornam o tipo de domínio. **Não acessam `req`/`res`**.

```ts
// Assinatura padrão
export async function criarRecursoService(dados: RecursoInput, tenantId: number): Promise<Recurso>
export async function listarRecursosService(tenantId: number): Promise<Recurso[]>
export async function obterRecursoPorIdService(id: number, tenantId: number): Promise<Recurso | null>
export async function atualizarRecursoService(id: number, dados: RecursoInput, tenantId: number): Promise<Recurso | null>
export async function deletarRecursoService(id: number, tenantId: number): Promise<boolean>
```

---

## Frontend Principal (`rlk-front/`)

### Stack
- React + TypeScript + Vite (porta `5174`)
- Ant Design (componentes e layout)
- React Router DOM (roteamento por URL)
- Axios ou fetch para chamadas à API

### Estrutura de navegação

A navegação é configurada em `rlk-front/src/layouts/navigationConfig.ts` com dois níveis:

- **Módulo** (menu superior): agrupa páginas relacionadas — ex.: `Governanca`, `Inventario de Dados`
- **Item** (menu lateral): página individual com `path` e `roles` opcionais

```ts
const NAVIGATION_MODULES: NavigationModule[] = [
  {
    key: 'governanca',
    label: 'Governanca',
    items: [
      { key: 'governanca-documentos', label: 'Documentos', path: '/documentos-empresa' },
      { key: 'governanca-comite',     label: 'Comite',     path: '/comites' }
    ]
  }
  // ...
];
```

Itens com `roles: ['ADMIN_MESTRE']` só aparecem para usuários com esse perfil. Itens com `hiddenInMenu: true` existem como rota mas não aparecem no menu (ex.: `/requisitos/novo`).

### Controle de acesso

O `role` vem do JWT (`req.usuario.role`) e determina quais módulos e itens são exibidos. Perfis disponíveis:
- `ADMIN_MESTRE` — acesso total, incluindo área de administração da plataforma
- `ADMIN` — administrador do tenant
- `USUARIO` — usuário comum
- `USUARIO_TAREFA` — acesso restrito a tarefas

### Chamadas à API

Usar sempre `VITE_API_URL` (variável de ambiente) como base das chamadas. Incluir o token JWT no header `Authorization: Bearer <token>`.

---

## Landing Page (`landing-front/`)

### Stack
- React + TypeScript + Vite (porta `5175`)
- Ant Design
- **Sem React Router DOM** — roteamento por estado local

### Roteamento por estado

Não existe `react-router-dom` nesta aplicação. A navegação entre páginas é feita com `useState`:

```ts
// landing-front/src/App.tsx
const [pagina, setPagina] = useState<'landing' | 'diagnostico'>('landing');

if (pagina === 'diagnostico') {
  return <DiagnosticoGratis onBack={() => setPagina('landing')} />;
}
return <LandingPage onDiagnostico={() => setPagina('diagnostico')} />;
```

Para adicionar uma nova "página": adicionar o literal ao tipo de `pagina`, criar o componente em `src/pages/`, e adicionar o `if` correspondente em `App.tsx`.

### Serviço de API

```ts
// landing-front/src/services/api.ts
const BASE = import.meta.env.VITE_API_URL;
```

Chamadas são unauthenticated (rotas públicas do backend). Usar endpoints de `diagnosticoPublicoRoutes`.

### Tracking

`App.tsx` expõe `trackEvent(event, section)` que empurra eventos para `window.dataLayer` (Google Tag Manager). Chamar em cada CTA relevante.

---

## Migrations (`migrations/`)

Arquivos SQL de DDL e seed. Nomeados por data: `YYYY-MM-DD_descricao.sql`. Executar manualmente no banco — não há ORM de migration automático. O diretório `prisma/` existe no repositório mas **não é o ORM principal**; o projeto usa `mysql2` direto.

---

## Variáveis de ambiente relevantes

| Variável         | Onde usa           | Descrição                         |
|------------------|--------------------|-----------------------------------|
| `PORT`           | backend            | Porta do servidor (padrão: 3000)  |
| `JWT_SECRET`     | backend            | Segredo para assinar o JWT        |
| `DATABASE_URL`   | backend            | Connection string MariaDB         |
| `VITE_API_URL`   | rlk-front, landing | URL base da API                   |
| `VITE_WHATSAPP_NUMBER` | landing      | Número WhatsApp para CTAs         |
