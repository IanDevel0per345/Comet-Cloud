# AUDIT.md — Comet Cloud (fork do Supabase Studio)

## 1. Visão geral

- **Repositório:** fork do repositório oficial do Supabase (`github.com/supabase/supabase`), renomeado para `Comet-Cloud`.
- **Monorepo pnpm + turbo:** apps = `design-system`, `docs`, `learn`, `lite-studio`, `studio`, `ui-library`, `www`.
- **App alvo:** `apps/studio` — o dashboard estilo Supabase (Next.js Pages + TanStack Router em migração).
- **Pacotes de UI:** `packages/ui` (componentes shadcn + temas), `packages/ui-patterns` (padrões de página), `packages/config` (tokens CSS, tailwind), `packages/icons` (ícones da marca: Database, Auth, Storage, SqlEditor etc.).
- **Tema ativo:** `classic-dark.css` (importado em `apps/studio/styles/globals.css`).

## 2. Sistema de design

- **Tokens de cor:** `packages/config/css/colors.css` (escalas amber/blue/crimson/gold/gray/green/indigo/orange/pink...) + `packages/ui/build/css/themes/{classic-dark,dark,light,faux-classic-dark}.css`.
- **Cores de marca (brand):** definidas por tema via `--brand-default`, `--brand-link`, `--brand-200..600` (hoje verdes ~153deg). A swap verde→laranja deve ocorrer **em todos os arquivos de tema**.
- **Tipografia/spacing/grid:** sem alterações.
- **Ícones:** biblioteca `packages/icons` (ícones de produto: Database, Auth, Storage, EdgeFunctions, Realtime, SqlEditor, TableEditor) — reusar com labels trocados.

## 3. Navegação do projeto (sidebar de produto)

- Arquivo central: `apps/studio/components/layouts/Navigation/NavigationBar/NavigationBar.utils.tsx`
  - `generateToolRoutes`: "Table Editor", "SQL Editor"
  - `generateProductRoutes`: Database, Authentication, Storage, Edge Functions, Realtime
  - `generateOtherRoutes`: Advisors, Observability, Logs, Integrations
- Menu mobile: `components/layouts/ProjectLayout/LayoutHeader/MobileMenuContent/mobileProductMenuRegistry.tsx` (e `mobileOrgMenuRegistry.tsx`).
- Projeto home: `routes/project/$ref/index.tsx` → `pages/project/[ref]/index` (HomePage).
- Rotas de seção: `routes/project/$ref/{database,auth,storage,sql,editor,functions,realtime,advisors,observability,logs,integrations,api,settings,branches,merge}`.

## 4. Rotas relevantes e seus destinos na transformação

| Rota atual | Conceito atual | Novo destino |
|---|---|---|
| `/project/$ref/` | Overview | Overview de hospedagem (serviços, deploys, uso, billing resumo) |
| `/editor` | Table Editor | **Serviços** (lista de serviços: Bot/API/Site/Worker) |
| `/sql` | SQL Editor | **Console de Deploy / Build** |
| `/database/*` | Database (schemas, roles, policies...) | **Configurações de Runtime/Build** + API Docs |
| `/auth/*` | Authentication | **Equipe e Acesso** |
| `/storage/*` | Storage | **Armazenamento (Volumes/Arquivos)** |
| `/functions/*` | Edge Functions | (adaptar textos → mantido, foco geral) |
| `/logs/*` | Logs | Logs/Monitoramento de serviços |
| `/integrations/*` | Integrations | **Integrações (GitHub, Webhooks, CLI)** |
| `/settings/*` | Settings | Configurações do Projeto |
| `/api` | API Docs | Endpoints/URL pública do serviço |
| `/observability/*` | Observability | Monitoramento |
| `/new/*` | New project wizard | Wizard de criação (hospedagem) |

## 5. Marca (rebranding)

- Textos "Supabase": espalhados em `apps/studio`, `packages/ui`, `packages/config`, favicon/public em `apps/studio/public`, `apps/www`.
- `<title>`: `apps/studio/lib/page-title.ts` (`buildStudioPageTitle`) e `pages/_document.tsx`.
- Favicon/manifest: `apps/studio/public/favicon*`, `manifest`.
- `apps/studio/package.json`: name "supabase", description "The Postgres Development Platform."
- Root `package.json`: name "supabase", description "The Postgres Development Platform."

## 6. Backend / modo de operação

- O studio normalmente conecta a um backend Supabase (meta/pg/auth/logflare). O repositório traz `apps/studio/.env` com `SUPABASE_URL=http://localhost:8000` (local).
- `NEXT_PUBLIC_SUPABASE_URL=https://xguihxuzqibwxjnimxev.supabase.co` apontado no `.env` (instância pública demo? verificar se funciona para preview).
- Para deploy na Vercel será preciso backend real OU modo demo/mock. Verificar se há modo "self-hosted without meta" — senão, criar camada de dados mock estática para o frontend demonstrativo.

## 7. Estratégia de transformação

1. **Paleta:** trocar todos os `--brand-*` (hsl ~153deg) por laranja (hue ~24-30deg) em: `classic-dark.css`, `dark.css`, `light.css`, `faux-classic-dark.css` + `code-hike.theme.json` (syntax highlight accent).
2. **Rebranding textual:** varredura global de "Supabase" → "Comet Cloud" (UI-facing); manter onde for técnico inevitável (urls internas, variáveis env de compat).
3. **Sidebar/nav:** reescrever `NavigationBar.utils.tsx` e registries mobile → Overview, Serviços, Console de Deploy, Armazenamento, Equipe e Acesso, Integrações, Logs, Billing/Configurações.
4. **Páginas:** adaptar cada seção de produto com o glossário da spec (Tabela→Serviço etc.).
5. **Dados:** criar camada mock (context/estado local + seed) para os fluxos da seção 7 funcionarem ponta a ponta (criar serviço, deploy, logs, rollback, domínio, convite de membro, billing, GitHub).
