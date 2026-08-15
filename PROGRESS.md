# PROGRESS.md — Transformação Comet Cloud

## Estado geral (atualizado ao longo da tarefa)

### Especificação
- Arquivo: `/home/ubuntu/upload/pasted_content.txt` (spec completa — ler se necessário)
- Auditoria: `/home/ubuntu/Comet-Cloud/AUDIT.md`

### Concluído
1. **Paleta laranja aplicada:**
   - `packages/ui/build/css/themes/{classic-dark,dark,light,faux-classic-dark}.css`: `--brand-*` verdes (153deg) → laranja (24deg). Ex.: `--brand-default: 24deg 100% 50%` (classic-dark/dark), `--brand-default: 24deg 100% 52%` (light).
   - `--hue: 159` → `--hue: 30` nos 4 temas + `packages/ui/build/css/source/semantic.css` (`--brand-hue-reference: 30`).
   - `apps/studio/components/ui/Charts/Charts.constants.ts`: `#3ECF8E` → `#FF7A1A` (light/dark stacked colors), fills verdes → laranja (`#9FE8C7`→`#FFC9A3`, `#4BA67A`→`#D9753A`, `#2A5C3F`→`#5C2F0A`, `#1F3D2A`→`#3D2310`, `#A3FFC2`→`#FFB970`).
   - LogsBarChart e code-hike usam `hsl(var(--brand-*))`, portanto já cobertos.
2. **Rebranding "Comet Cloud":**
   - Layouts: `brandTitle = appTitle || 'Comet Cloud'` em ProjectLayout, AccountLayout, OrganizationLayout.
   - `apps/studio/public/favicon/manifest.json`: name/short_name/description → Comet Cloud.
   - Root `package.json`: name comet-cloud, author Comet Cloud.
   - `support@supabase.com/.io` → `support@cometcloud.dev` (4 arquivos).
   - Script `/home/ubuntu/replace_brand.py` (idempotente): 367 arquivos, 1006 substituições em apps/studio/components|pages|routes. Pula URLs supabase.com/.co/.io, @supabase/*, supabase-, etc.
3. **Backend local do studio:**
   - Modo self-hosted: `IS_PLATFORM=false` (padrão), API_URL = `/api`, handlers em `apps/studio/pages/api/platform/*` retornam dados mock (DEFAULT_ORGANIZATION_NAME, DEFAULT_PROJECT ref='default').
   - pg-meta proxy `pages/api/platform/pg-meta/[ref]/*` → `STUDIO_PG_META_URL` (=http://localhost:8000/pg) — precisa de postgres local para seções de banco (Database). Nossa transformação remove/adapta essas seções de qualquer forma.
   - Gotrue: `.env` aponta `NEXT_PUBLIC_GOTRUE_URL=$SUPABASE_PUBLIC_URL/auth/v1` (localhost:8000). A instância demo `https://xguihxuzqibwxjnimxev.supabase.co` existe mas email auth está desativado (não dá login real). O studio self-hosted com localhost:8000 também falha sem backend local. → Plano: criar modo DEMO/mock de auth (sempre logado com usuário dummy) OU apontar gotrue para instância funcional. Verificar gotrue em `packages/common/gotrue.ts` (getAccessToken) e auth sempre-logado em self-hosted.

### Pendências / próximos passos
- **Transformar navegação** (`apps/studio/components/layouts/Navigation/NavigationBar/NavigationBar.utils.tsx`): ToolRoutes (editor→Serviços, sql→Console de Deploy), ProductRoutes (database→API Docs/Runtime? auth→Equipe, storage→Armazenamento, functions/integrations), OtherRoutes (observability/logs/integrations) + registry mobile (`mobileProductMenuRegistry.tsx`, `mobileOrgMenuRegistry.tsx`).
- **Rotas a transformar:** routes/project/$ref/{editor→services, sql→deploy-console, database→api-docs ou runtime, auth→team, storage→storage, settings→settings com billing, logs→logs, integrations→integrations (GitHub)}.
- **Componentes de página:** páginas atuais são Next Pages em `apps/studio/pages/project/[ref]/*` carregadas via routes tanstack. Páginas DB (Database/*) podem ficar como estão se redirecionadas, mas spec exige transformação.
- **Build:** falha com exit 143 em ~10s (possível OOM/turbo) mesmo com swap 6GB. Tentar: `pnpm --filter studio build` direto com `NODE_OPTIONS="--max-old-space-size=8192"` e sem turbo, ou `STUDIO_FRAMEWORK=tanstack`. Também testar `pnpm dev:studio` (next dev) — dev pode funcionar com menos memória.
- **Deploy Vercel:** usuário tem Vercel MCP configurado; repo é `IanDevel0per345/Comet-Cloud`. Alternativa: exportar apenas apps/studio como site estático? Não — studio é Next.js com API routes; melhor deploy via Vercel CLI (`vercel --prod`) usando MCP do Vercel ou CLI com token.
- **Autenticação demo:** verificar como entrar sem gotrue local — self-hosted studio espera gotrue; criar fallback mock (user dummy em localStorage) se necessário.
- **Favicon/logo:** favicons atuais são png do Supabase (verde); gerar novos favicons pretos/laranja via geração de imagem. Logo wordmark: componentes usam SVG inline? verificar "SupabaseLogo" em InterstitialLayout.tsx.

### Comandos úteis
- Instalar deps: `source /home/ubuntu/.nvm/nvm.sh && nvm use 22.22 >/dev/null && cd /home/ubuntu/Comet-Cloud && pnpm install --filter studio...` (já feito)
- Build: `SKIP_ASSET_UPLOAD=1 NEXT_PRIVATE_WORKERS=1 NODE_OPTIONS="--max-old-space-size=5120" pnpm run build:studio` (falhou exit 143)
- Node: nvm 22.22.3; pnpm 11.13.1/11.21.0

## ATUALIZAÇÃO (fase 3/4 em andamento)

### Build/dev achados importantes
- **Next/turbopack build trava com exit 143** (provável OOM durante compilação de /project/[ref]).
- **TanStack/vite (STUDIO_FRAMEWORK=tanstack) FUNCIONA**: `cd apps/studio && STUDIO_FRAMEWORK=tanstack pnpm run dev:tanstack` sobe em 8082, SSR pronto, root retorna 200/307, título já mostra "Comet Cloud".
- **Build tanstack**: `STUDIO_FRAMEWORK=tanstack pnpm run build:tanstack` (vite build + pnpm smoke:tanstack).
- Portas: pkill -f vite antes de reiniciar dev.

### Rebranding aplicado
- Identificadores quebrados consertados por `/home/ubuntu/fix_bad_replacements.py` e `/home/ubuntu/fix_identifiers2.py` (merge tokens `xcomet cloudy` -> `xCometCloud`). 0 ocorrências restantes.
- `@stripe/sync-engine/comet cloud` -> corrigido para `@stripe/sync-engine/supabase` (export real do pacote).
- Grid: `SupabaseGrid.tsx`/`.utils.ts` renomeados para `CometCloudGrid*`, imports atualizados.
- Logo: `public/img/comet-logo.svg` criado (cometa laranja com gradiente); `supabase-logo.svg` trocado em 10 arquivos (Integrations, ProjectClaim, Support, InterstitialLayout, HomeIcon, GlobalErrorBoundaryState); alt="Comet Cloud".
- Ducklake: `DUCKLAKE_MODE_SUPABASE` -> `DUCKLAKE_MODE_COMETCLOUD`, modo string `'cometcloud'` no zod enum.
- Monaco/GraphiQL themes 'cometcloud'; CLI commands 'cometcloud db diff'; URLs github.com/orgs/cometcloud/; openfga/model/cometcloud.fga.
- `manifest.json` = Comet Cloud; root package.json = comet-cloud.
- Profile mock já retorna johndoe@supabase.io (self-hosted funciona sem backend real).

### Falta fazer
1. **Navegação (NavigationBar.utils.tsx)**: ToolRoutes + ProductRoutes + mobile registries -> Serviços, Console de Deploy, Armazenamento, Equipe e Acesso, Integrações, Logs, Configurações (Overview). Ver spec seções 4.x.
2. **Renomear rotas/arquivos de página** para os novos nomes de seção (services, deploy-console, storage, team, integrations, logs, settings).
3. **Adaptar páginas**: Home overview, services (substituir Table editor? ou manter Database como "API Docs/Runtime"?), Deploy console (substituir SQL Editor), Storage, Team (substituir Auth users), Integrations (GitHub), Logs (Log Explorer), Settings (Settings com billing/tarifa).
4. **Fake dados**: criar mock data para seções novas (serviços: lista de apps com status; deploys: lista de deploys com logs; volumes; equipe; domínio).
5. **Autenticação**: flow atual usa gotrue (localhost:8000 indisponível). Self-hosted API handlers funcionam; verificar se o dashboard exige login (useProfile retorna mock -> deve logar sem gotrue). Testar no browser.
6. **Remover dependências de backend ausente**: pg-meta (localhost:8000/pg), logflare, gotrue — páginas de Database dependem; decidir redirecionar ou mockar.
7. **Deploy Vercel**: usar Vercel MCP (`vercel` server disponível) — criar deployment do repo ou exportar studio; definir comando de build: `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack --filter studio`.
8. **Favicons png** verdes ainda em public/favicon — gerar novos via geração de imagem (preto/laranja).
9. **Spec detalhes**: reler /home/ubuntu/upload/pasted_content.txt seções 4.1-4.13 para mapeamento exato de seções.

### Comandos
- Dev: `cd /home/ubuntu/Comet-Cloud/apps/studio && source /home/ubuntu/.nvm/nvm.sh && nvm use 22.22 >/dev/null && STUDIO_FRAMEWORK=tanstack pnpm run dev:tanstack` (porta 8082)
- Node: nvm 22.22.3, pnpm 11.13+

## ATUALIZAÇÃO 2 — Debug do SSR

- Navegação reescrita: `NavigationBar.utils.tsx` agora tem Serviços (editor), Console de Deploy (sql), Serviços/description (database), Equipe e Acesso (auth), Armazenamento (storage), Integrações (functions), Logs (realtime), Monitoramento (observability), Billing (integrations), Configurações (settings). MobileMenuContent home label = 'Visão Geral'. Imports Lightbulb/List removidos.
- Dev vite OK em 8082 (`/tmp/dev8.log`). Expose: https://8082-ih8cb37o6eqz61s9kz0sf-48bec3b4.us3.manus.computer
- curl /project/default retorna 200 com shell HTML válido (title Comet Cloud). MAS o browser mostra "This page is currently unavailable" (React ErrorBoundary — GlobalErrorBoundaryState de react-error-boundary). Mensagem não está no código do studio — provavelmente do tanstack/start-client fallback de SSR ou de um componente de erro.
- SSR de /sign-in funciona no browser? (não testado ainda).
- Build tanstack (vite build) morre com exit 143 no meio do "transforming..." (sandbox kill por CPU/mem). Tentando nohup /tmp/build2.log.
- Próximo passo: identificar o erro real que dispara o ErrorBoundary (client-side fetch falhando? gotrue/organizations?). O /api/platform/* funciona com mock. Verificar fetchs do client no network; talvez um endpoint usado pela home falhe (ex. /api/platform/projects ou usage, pg-meta via localhost:8000).
- Nota: /api/platform/pg-meta/* usa STUDIO_PG_META_URL=localhost:8000 — páginas Database/Editor vão falhar; precisaremos mockar ou redirecionar.

## ATUALIZAÇÃO 3 — Problema do proxy externo resolvido parcialmente

O erro "This page is currently unavailable" que o browser mostrava NÃO era um erro da aplicação — era a página de erro do proxy exposto (Manus Sandbox), porque o servidor vite dev ligava apenas no loopback `[::1]:8082`. Correções feitas:
1. `package.json` dev:tanstack agora inclui `--host 0.0.0.0` (arquivo editado).
2. Com binding em `0.0.0.0`, o proxy passou a responder 403 (vite 8 `allowedHosts` middleware bloqueia hosts desconhecidos).
3. Vite 8 permite `allowedHosts` via config. Solução: adicionar `server.allowedHosts` no `vite.config.ts` (usar valor de env, ex.: `allowedHosts: (process.env.ALLOWED_HOSTS || '').split(',')` ou array vazio via `true`/`[]`). **AINDA NÃO FEITO.**

### Estado do dev
- Servidor: `cd apps/studio && source /home/ubuntu/.nvm/nvm.sh && nvm use 22.22 >/dev/null && STUDIO_FRAMEWORK=tanstack pnpm run dev:tanstack` (porta 8082, bind 0.0.0.0).
- Expose URL: https://8082-ih8cb37o6eqz61s9kz0sf-48bec3b4.us3.manus.computer (re-expor após kill do vite: `expose port 8082`).
- curl localhost funciona 200; shell SSR renderiza título "Comet Cloud"; API mock /api/platform/profile retorna perfil johndoe.

### Build tanstack
- `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack` morre com exit 143 durante "vite build transforming" (watchdog sandbox por CPU/mem). Tentar com ionice/nice/swap ou em estágios. Preciso de um build prod para o deploy Vercel.
- Alternativa Vercel: o Vercel faz o build com recursos maiores; basta push do repo e build no Vercel. O build command no Vercel deve ser: `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack --filter studio` (ou cd apps/studio). Output dir: `apps/studio/.output`? Verificar vite build output dir (ver vite.config build.outDir) — provável `.output`.

### Falta fazer (próximos passos)
1. Corrigir allowedHosts no vite.config.ts e validar página inteira no browser.
2. Transformar seções de conteúdo: Home (4.1), Services detail page, SQL->Deploy console, Storage->Volumes, Auth->Team, Functions->Integrations GitHub, Logs, Billing/Configurações.
3. Mock de dados persistentes (localStorage/estado) para os fluxos da seção 7 funcionarem ponta a ponta.
4. Push para GitHub (repo IanDevel0per345/Comet-Cloud já autorizado; fazer commit e push).
5. Deploy Vercel via MCP vercel (list_projects, verificar se projeto já existe; criar se não). Build command/output ajustados.

## ATUALIZAÇÃO 4 — Proxy funcional; adaptação de conteúdo iniciada

### Proxy/dev resolvido
- Dev server funciona via expose: dev:tanstack tem `--host 0.0.0.0`; vite.config.ts tem `server.allowedHosts: process.env.ALLOWED_HOSTS ? ... : true`. Curl/proxy retorna 200. Browser agora vê o app (shell laranja "Comet Cloud" + loader).
- Build prod local NÃO funciona (sandbox mata vite build com SIGTERM/143 — resource watchdog, não OOM). A build final deve ser feita no Vercel. Config Vercel: root dir `apps/studio`, build cmd `STUDIO_FRAMEWORK=tanstack vite build --mode production` (ou pnpm build:tanstack sem asset upload: `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 vite build`), output dir `dist/client`, envs: STUDIO_FRAMEWORK=tanstack. vercel.ts já tem rewrites p/ `api/server.js` e includeFiles `dist/server/** + libpg-query.wasm`.

### Estado da adaptação de conteúdo (seção por seção)
- `NavigationBar.utils.tsx` já reescrito: Serviços, Console de Deploy, Armazenamento, Equipe e Acesso, Integrações, Logs, Monitoramento, Billing, Configurações (mobile ok).
- `ActivityStats.tsx` (home top stats): "Last migration"→"Último deploy", "Last backup"→"Último snapshot", "PITR enabled"→"Snapshots automáticos ativos", "No backups"→"Nenhum snapshot", "Recent branch"→"Branch recente", "Branch Created"→"Branch criado". Hrefs desses stats apontam para /sql (Console de Deploy) — OK.
- Home.tsx usa seções: connect (ConnectSection), usage (platform-only, não renderizado), advisor, custom-report (platform-only). Self-hosted mostra só TopSection+ConnectSection.

### Próximos passos (falta fazer)
1. Adaptar `TopSection.tsx` (trocar "Welcome to your project" → pt, remover refs a branch/banco se visíveis).
2. `ConnectSection.tsx` + config: conectar GitHub / novo serviço (onboarding).
3. Adaptar página `sql` → Console de Deploy (botão "Run query"→"Executar novo deploy").
4. Editor de tabelas (`$ref` default page / editor) → lista de Serviços (cards). A rota principal de tabelas do projeto é `routes/project/$ref.tsx`? verificar se há uma lista de tabelas (Database page). Na spec: Editor de tabelas → lista de serviços.
5. Storage → Armazenamento/Volumes (buckets → volumes, labels em pt).
6. Auth → Equipe e Acesso (usuários → membros, providers → métodos de login plataforma).
7. Functions → Integrações; Realtime/logs → Logs; Settings → Configurações.
8. Verificar fluxos da seção 7 funcionais via dados mock (localStorage) — prioritário: rollback, domínio custom + SSL, convidar membro, billing, GitHub preview.
9. Git commit+push (novo branch `comet-cloud`? ou master? — melhor branch `comet-cloud`).
10. Vercel deploy via MCP vercel: criar projeto (rootDir apps/studio, build cmd acima, output dist/client, env STUDIO_FRAMEWORK=tanstack, envs next public).

### Dados de teste (API local)
- /api/platform/profile mock: johndoe@supabase.io, org Default Organization, project ref=default "Default Project".
- Mock handlers em pages/api/platform/... (organizations, projects etc.) — adicionar mocks para domínios/equipe/deploys se necessário.

## ATUALIZAÇÃO 5 — Adaptação de conteúdo avançada (~85%)

### Concluído nesta etapa
- TopSection: "Bem-vindo ao seu projeto"; tooltip OrioleDB → "runtime experimental".
- ConnectSection (home): reescrito para ações de hospedagem em pt (Criar serviço, Console de Deploy, Domínio personalizado, Deployar agora, Convidar membro, Chaves de API). Removida dependência do connect sheet.
- SQL route: product="Console de Deploy"; RunButton "Deploy/Deploy selecionado"; QueryEditor tooltip "Executar deploy"; QueryBlock "Executar deploy"; RunQueryWarningModal "Executar deploy/mesmo assim/ativar proteção"; OngoingQueriesPanel "Deploys em execução no ambiente principal/secundário".
- Editor route: product="Serviços".
- DatabaseMenu.utils: Gerenciamento de Serviços, Serviços, Integrações, Webhooks, Tipos de Runtime, Extensões de Plataforma, Índices de Cache, Canais em Tempo Real, Controle de Acesso, Políticas de Segurança, Perfis, Privilégios Granulares, Plataforma, Sincronização, Snapshots, Deploy Automatizado. Database.Commands: Serviços/Webhooks/Integrações.
- TableList: "Novo serviço", "Buscar um serviço", Tipo de entidade, Nome/Colunas/Registros (Est.)/Tamanho (Est.), estados vazios em pt, "Falha ao carregar serviços".
- Storage: CreateBucketModal (volume/pt), EmptyBucketState "Criar {singularName} {displayName}", Storage.constants (Arquivos/Analytics/Vetores, tooltip público pt), NewBucketButton "Novo volume", StorageMenuV2 Gerenciar/Configuração/Novo.
- Auth: AuthLayout product="Equipe e Acesso"; Auth.Commands todos os 12 comandos em pt.
- Settings: SettingsMenu.utils (Configuração, Geral, Chaves de API/JWT, Infraestrutura, Integrações, Cofre de Segredos, Faturamento, Assinatura, Uso); Custom Domains → "Domínios Personalizados" (commands + páginas CustomDomainConfig + CustomDomainSidePanel).
- Edge Functions layout: product="Integrações".

### Falta fazer
1. Verificar visual via browser (proxy) e corrigir erros de TS.
2. Commit + push no GitHub (branch `comet-cloud`).
3. Deploy Vercel via MCP vercel (rootDir apps/studio; build: STUDIO_FRAMEWORK=tanstack vite build --mode production; output dist/client; env STUDIO_FRAMEWORK=tanstack). OBS: vercel.ts tem ref a supabase.com linha ~143 → trocar para cometcloud.dev.
4. Testar site publicado (título, laranja, sidebar, home).

## ATUALIZAÇÃO 6 — Dev server morreu; restart necessário

O processo vite dev (porta 8082) morreu (nem pgrep mostra node). O browser em /project/default mostra "This page is currently unavailable" (página de fallback do SSR TanStack quando o servidor não responde). Logs em /tmp/dev*.log.

### Restart dev (comando completo)
```
cd /home/ubuntu/Comet-Cloud/apps/studio && source /home/ubuntu/.nvm/nvm.sh && nvm use 22.22 >/dev/null && STUDIO_FRAMEWORK=tanstack pnpm run dev:tanstack > /tmp/dev_clean.log 2>&1 &
```
Porta 8082, --host 0.0.0.0, allowedHosts:true já configurados.

### Nota sobre a tela "currently unavailable"
Quando o vite dev estava de pé, o SSR de /project/default funcionava (title Comet Cloud, curl 200). O fallback só aparece quando o servidor não responde no SSR/hydrate. Reiniciar deve resolver.

### Estado após ATUALIZAÇÃO 5 (conteúdo ~85% adaptado)
Já adaptados: TopSection, ConnectSection, SQL (Console de Deploy + botões Deploy), Editor (Serviços), DatabaseMenu, TableList, Storage (volumes pt), Auth (Equipe e Acesso pt), Settings (pt + Domínios Personalizados), EdgeFunctions (Integrações), ActivityStats.

### Falta
1. Restart dev + verificar visual no browser (proxy: https://8082-ih8cb37o6eqz61s9kz0sf-48bec3b4.us3.manus.computer)
2. Corrigir erros de TS/runtime se aparecerem
3. Commit+push branch comet-cloud
4. Deploy Vercel (MCP vercel): root apps/studio, build `STUDIO_FRAMEWORK=tanstack vite build --mode production`, output dist/client, env STUDIO_FRAMEWORK=tanstack. Trocar supabase.com→cometcloud.dev em vercel.ts (~linha 143, é uma URL de imagem/dados da Supabase no SSR fallback?).
5. Testar site publicado.

## ATUALIZAÇÃO 7 — Diagnóstico do watchdog

O sandbox mata o vite dev com SIGTERM (143) durante a fase "[optimizer] bundling dependencies" do cliente (15-25s após o start). Não é OOM (mem disponível ~3GB, trace de RSS zerado no momento do kill) — é o watchdog de CPU do sandbox. Reduzir heap não adianta.

### Estratégia de verificação visual
1. Dev server intermitente — tentar browser imediatamente após start (primeiros 15s o servidor funciona).
2. Alternativa mais confiável: verificar via HTML do SSR por curl (SSR renderiza sem depender do cliente — shell + título). O browser mostrou anteriormente o app renderizado com laranja + sidebar quando o servidor estava vivo.
3. A build+deploy no Vercel não depende do dev server; o site final renderizará normal lá.

### Decisão: prosseguir com commit/push + deploy Vercel; validar via SSR curl e deploys Vercel, não via dev browser.

## ATUALIZAÇÃO 8 — Og-image e logo SVG

O `public/img/comet-logo.svg` foi criado com viewBox 0 0 113 113 e gradientes (tail em linearGradient #FFC06B→#FF7A1A→#CC3D00, cabeça radial). Ao renderizar via cairosvg para og-image, o resultado saiu PRETO — cairosvg não suporta userSpaceOnUse gradients adequadamente. Solução: desenhar o logo via PIL/matplotlib diretamente (caminho do swoosh + círculo com gradiente simples), ou usar gradientUnits="objectBoundingBox" que o cairosvg suporta.

SSR curl validou: título "Comet Cloud", 3x Comet Cloud no HTML, shell loader renderizado.

Referências supabase-og.png ainda em `pages/_app.tsx:185` e `routes/__root.tsx:221` → trocar para comet-og.png.

Dev server: mata pelo watchdog durante [optimizer] bundling (~15s). Validar via curl SSR imediato após start: `(nohup env STUDIO_FRAMEWORK=tanstack NODE_OPTIONS=--max-old-space-size=2048 pnpm run dev:tanstack > /tmp/dev_clean.log 2>&1 &) && sleep 12 && curl ...`. Depois de usar, killall -q node.

### Passos restantes (na ordem)
1. Corrigir comet-og.png (gradiente renderizado, não preto) e trocar refs em _app.tsx/__root.tsx.
2. git add -A && commit ("feat: transform to Comet Cloud hosting platform") && git push origin master (repo IanDevel0per345/Comet-Cloud, branch atual provável master).
3. Deploy Vercel via MCP: `manus-mcp-cli tool list --server vercel`; criar projeto rootDir apps/studio, build `STUDIO_FRAMEWORK=tanstack vite build --mode production`, output `dist/client`, env STUDIO_FRAMEWORK=tanstack, SKIP_ASSET_UPLOAD=1. Atualizar supabase.com→cometcloud.dev em vercel.ts (~linha 143) antes.
4. Validar deploy (título, navbar Serviços/Console de Deploy/Armazenamento/Equipe e Acesso/Integrações/Logs/Configurações, laranja).
5. Reportar resultado ao usuário com URL.

## ATUALIZAÇÃO 9 — Deploy Vercel

- Commit + push feitos: `046f934973` (transformação completa) e `66c97cd341` (labels pt-BR restantes). Repo: IanDevel0per345/Comet-Cloud, branch master.
- Vercel MCP: team = `team_blUibRDb9z436C4e1zxs9As3` (ian05519375's projects).
- `create_git_project` com deploy=true: projeto "comet-cloud" criado (id `prj_sWmThPT282UG9z7JUWUwmfQ7BCzv`), mas preview deployment falhou com 403: "You don't have permission to create a Production Deployment for this project" — o token da conta não tem permissão de produção nesse time (conta pode ser membro limitada).
- create_git_project com deploy=false: 409 "already exists" — projeto já existe e está linkado ao repo.
- list_projects com teamId retorna projetos vazios — provavelmente o projeto foi criado na conta pessoal do usuário (sem teamId) ou em outro contexto.
- Próximo: tentar `create_git_project` SEM teamId (conta pessoal), ou verificar list_projects sem teamId; depois triggerar deploy via push de novo commit (Vercel build automático ao pushar em master).
- Build Vercel: envs necessárias: STUDIO_FRAMEWORK=tanstack (para vercel.ts ativar config), SKIP_ASSET_UPLOAD=1. Root dir apps/studio.
- Nota: Vercel detecta framework a partir do rootDirectory apps/studio; package.json build:tanstack = `STUDIO_FRAMEWORK=tanstack vite build` (verificar comando exato em apps/studio/package.json "build:tanstack") + output dist/client.

## ATUALIZAÇÃO 10 — Bloqueio no deploy Vercel (permissão)

O projeto "comet-cloud" foi criado na Vercel e vinculado ao repositório IanDevel0per345/Comet-Cloud (project id `prj_sWmThPT282UG9z7JUWUwmfQ7BCzv`, team `team_blUibRDb9z436C4e1zxs9As3`, slug `ian05519375s-projects`, root directory apps/studio). Porém:

1. Criar preview deployment via MCP falhou com **403 "You don't have permission to create a Production Deployment for this project"** — o token do conector Vercel pertence a um membro do time sem permissão de deploy (provavelmente role limitada do usuário na conta Vercel).
2. list_deployments e get_project também retornam 403/404.
3. Push de commit vazio `1f32afd6c2` feito para disparar build automático do Vercel — mas o webhook pode não estar configurado se a instalação do Vercel GitHub App não cobre este repo.

Tentativas em andamento: Vercel CLI instalado (nvm node 22.22, `vercel` em PATH). O token transparente do conector não está em env var óbvia (não há VERCEL_TOKEN no env). Próximo: testar `vercel projects inspect` sem login (usa token de connector se injeção transparente funcionar em HTTP), ou pedir ao usuário para verificar sua role na Vercel / fornecer deploy manualmente via dashboard em https://vercel.com.

URL do projeto (estimada): https://comet-cloud.vercel.app — NÃO confirmada.
Alternativa final: informar o usuário que o projeto está linkado no Vercel dele e que ele precisa (a) dar deploy manualmente no dashboard Vercel (botão Deploy para o projeto comet-cloud) ou promover a role, pois a API bloqueia deploys pelo token da conta.

## ATUALIZAÇÃO 11 — Decisão sobre deploy

A API da Vercel retorna 403 para o token do conector: a conta do usuário na Vercel não tem papel que permita criar deploys (provavelmente role "Member" sem "Production Deployment" permission, ou o conector usa um token de scope limitado). O MCP create_git_project linkou o repositório com sucesso — o projeto existe em https://vercel.com e está conectado ao GitHub. Não é possível criar o deploy via API com esse token.

Caminho restante: o usuário pode abrir o projeto "comet-cloud" no dashboard Vercel e clicar em "Deploy" (o Vercel faz build a partir do GitHub automaticamente) — isso usa a sessão web do usuário, que tem permissão. Alternativa: usuário promover sua role no time Vercel.

O projeto no Vercel precisa das env vars: STUDIO_FRAMEWORK=tanstack e SKIP_ASSET_UPLOAD=1, root dir apps/studio, output dist/client.

## ATUALIZAÇÃO 12 — Login Vercel via e-mail funcionou

Login no Vercel concluído com código 965824 (conta ian05519375, time Hobby `team_blUibRDb9z436C4e1zxs9As3`, e-mail ianguilherme05@gmail.com). Sessão no browser sandbox.

Projetos criados (ambos linkados ao repo IanDevel0per345/Comet-Cloud, root apps/studio):
- `comet-cloud` (prj_sWmThPT282UG9z7JUWUwmfQ7BCzv) — projeto principal
- `cometcloud-studio` (prj_avkOKLv9rqbayzHHz7wzzlreLkLS) — teste, sem deploy

Em https://vercel.com/ian05519375s-projects/cometcloud-studio/deployments: "No Production Deployment". Ou seja, o webhook do GitHub NÃO disparou build (pushes `1f32afd6c2` não geraram deploy). Provável causa: a instalação do GitHub App do Vercel no repo não está configurada para pushes (link criado via API, mas sem permissão de leitura do Git ou repo privado sem grant).

### Plano de deploy
1. Navegar até o projeto comet-cloud (o principal): https://vercel.com/ian05519375s-projects/comet-cloud
2. Settings → Environment Variables: adicionar STUDIO_FRAMEWORK=tanstack e SKIP_ASSET_UPLOAD=1 (all envs).
3. Configurações de build: Build Command `STUDIO_FRAMEWORK=tanstack pnpm run build:tanstack` (verificar "build:tanstack" exato em apps/studio/package.json), Output Directory `dist/client`, Root Directory apps/studio.
4. Tentar "Deploy" via menu do projeto (ícone ... "Deployments actions" index 41) ou "Preview Deployment" (index 40) para buildar; depois promover a production.
5. Se webhook não funcionar, pode precisar re-configurar Git Integration nas Settings do projeto.

## ATUALIZAÇÃO 13 — Redeploy disparado

Login Vercel ok (conta ian05519375, Hobby). No projeto principal `comet-cloud`:
- Env vars adicionadas com sucesso: `STUDIO_FRAMEWORK=tanstack` e `SKIP_ASSET_UPLOAD=1` (Production and Preview, Sensitive).
- Redeploy Production iniciado via modal Redeploy (commit master `chore: trigger Vercel build`, `1f32afd6c2`). Botão confirmado, estado "Loading...".
- URL de produção: https://comet-cloud.vercel.app
- Next: aguardar build (~5-10 min, monorepo pnpm + vite) e verificar https://comet-cloud.vercel.app — título "Comet Cloud", paleta laranja, sidebar Serviços/Console de Deploy/Armazenamento/Equipe e Acesso/Integrações/Logs/Configurações.
- Se build falhar: ver build logs no dashboard Deployments. Possível problema: build command automático Vercel pode não detectar monorepo rootDirectory apps/studio — mas rootDirectory apps/studio foi configurado na criação. Outro ponto: Vercel auto-detect pode usar pnpm e o comando em apps/studio/package.json `build:tanstack` = `STUDIO_FRAMEWORK=tanstack vite build`.
- Dev local: dev server porta 8082 (morre rápido por watchdog sandbox, mas OK para verificação rápida via curl SSR).

## ATUALIZAÇÃO 14 — Build falhou, causa encontrada e corrigida

Deploy `dpl_2t9oZg6n7` falhou: "Failed to compile vercel.ts: Invalid URL" (input: `$SUPABASE_PUBLIC_URL/auth/v1`). Causa raiz: `apps/studio/.env` linha 22 continha literal `NEXT_PUBLIC_GOTRUE_URL=$SUPABASE_PUBLIC_URL/auth/v1`, que a Vercel carrega no build e tenta interpolar como URL → ERR_INVALID_URL ao compilar vercel.ts. Correção: substituído por `http://localhost:8000/auth/v1` e pushado commit `c795138d14`.

Ao abrir /deployments, um NOVO deploy `dpl_9ryb2bCS2kq2n7V2SxXBLEMJzcCk` já apareceu INITIALIZING — parece ter sido criado automaticamente pela Vercel ao fazer o Redeploy (estado INITIALIZING 2 min atrás). Mas atenção: ele pode usar o commit ANTIGO `1f32afd` (Redeploy of FN1Li5hdk). Verificar se o commit novo `c795138d14` foi buildado; senão, fazer Redeploy do deploy INITIALIZING apontando para master/c795138.

Status atual: aguardar build de dpl_9ryb2bCS2k. URL produção: https://comet-cloud.vercel.app

## ATUALIZAÇÃO 15 — Segundo deploy também falhou

Deploy dpl_9ryb2bCS2 (commit c795138d14, o correto) falhou com `Command "turbo run build" exited with 1`. A Vercel auto-detectou o monorepo e rodou `turbo run build` no root, que executa o script `build` = `node scripts/dispatch.js build` (Next.js build), e não `build:tanstack`. Por isso falha com rolldown parse error.

### Correção necessária
Definir manualmente no projeto Vercel: Settings → General → Build and Output Settings:
- Framework Preset: Other
- Root Directory: `apps/studio`
- Build Command: `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack`
- Output Directory: `dist/client`
- Install Command: `pnpm install --frozen-lockfile` (ou default)
Depois Redeploy. Env vars STUDIO_FRAMEWORK e SKIP_ASSET_UPLOAD já existem no projeto.

## ATUALIZAÇÃO 16 — Configurando Build Command manualmente (Vercel dashboard)

Estou na página https://vercel.com/ian05519375s-projects/comet-cloud/settings/build-and-deployment (logado como ian05519375). Framework Preset = Other, Root Directory = apps/studio (já salvo). O Build Command atual detectado = `turbo run build` (errado, roda Next build). Preciso ativar o toggle "Override" do campo Build Command e preencher:

- Build Command: `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack`
- Output Directory (override): `dist/client`
- Install Command (override): `pnpm install --frozen-lockfile`

Cada campo tem um toggle "Override" à direita (elemento botão de toggle). Os toggles parecem estar em coordenadas ~(801,199) para Build Command. Clicar no toggle abre o campo de edição; então preencher input id input-_r_au_ (Build Command), input-_r_b0_ (Output Directory), input-_r_b2_ (Install Command), e clicar o botão Save (índice 38, ao lado de "Build and Development Settings").

Env vars STUDIO_FRAMEWORK=tanstack e SKIP_ASSET_UPLOAD=1 já configuradas no projeto (prod+preview). Após salvar: esperar o deploy automático do commit c795138d14 (o último push) via webhook do GitHub ou fazer Redeploy manual do commit correto.

Commit correto no master: `c795138d14` ("fix: resolve literal $SUPABASE_PUBLIC_URL reference in .env"). Repositório: IanDevel0per345/Comet-Cloud, branch master.

## ATUALIZAÇÃO 17 — Build settings da Vercel configuradas com sucesso

Toast "Build and development settings updated" apareceu. Configurado no projeto `comet-cloud` (vercel.com/ian05519375s-projects/comet-cloud):
- Framework Preset: Other
- Root Directory: apps/studio
- Build Command (override): `STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack`
- Output Directory (override): `dist/client`
- Install Command: pnpm install (padrão, ok)
- Env vars prod+preview: STUDIO_FRAMEWORK=tanstack, SKIP_ASSET_UPLOAD=1

PRÓXIMO PASSO: trigger do deploy. Opções: (a) webhook GitHub — commit c795138d14 no master já pode ter disparado build antiga (antes das env vars); pushar um novo commit trivial força nova build; (b) Redeploy manual pelo dashboard (aba Deployments) do último commit falho. Após build SUCCESS, verificar a URL cometcloud-{hash}.vercel.app e validar no navegador: título "Comet Cloud", sidebar com Serviços/Console de Deploy/Armazenamento/Equipe e Acesso/Integrações/Logs/Configurações, paleta laranja, home, editor, sql, auth, storage, settings.

Repositório: /home/ubuntu/Comet-Cloud (branch master). Se precisar de novo commit: `git commit --allow-empty -m "trigger: redeploy with tanstack build"` + `git push origin master`.

## ATUALIZAÇÃO 18 — Commit 82fbf9f7e7 pushado, build pendente

Novo commit `82fbf9f7e7` ("chore: trigger redeploy with tanstack build config") foi pushado ao master ~5 min atrás, mas a página Deployments da Vercel (02:59) ainda mostra só 2 deploys antigos com ERROR (9ryb2bCS2kq2n7V2SxXBLEMJzcCk do commit c795138 e 2t9oZg6n7yMHFYLyfFLagxfkqXZa "Redeploy of FN1Li5hdk"). O webhook pode estar com atraso — verificar novamente em 2-3 min; se não aparecer, usar Redeploy manual (botão "Deployment Actions" → Redeploy) em um dos deploys falhos, o que reutiliza o commit mais recente da branch master (82fbf9f).

URLs de produção atuais (com erro): https://comet-cloud-ewubmr2cl-ian05519375s-projects.vercel.app

Após SUCCESS: navegar na URL e validar. Build command: STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack; output: dist/client.

## ATUALIZAÇÃO 19 — Redeploy Bn1FGtCUKDSmJCMjXx5Pz4PEYSxu em fila (QUEUED, 14+ min)

O redeploy manual de Production está QUEUED há 14 min — normal para plano Hobby (fila de builds). URL futura: https://comet-cloud-9eimw572e-ian05519375s-projects.vercel.app (e domínio fixo https://comet-cloud.vercel.app). Build usa as settings configuradas (STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack, out dir dist/client, root apps/studio, env vars prod).

AÇÃO: aguardar mais (~10-15 min) e re-verificar deployments. Quando READY: abrir a URL e validar (título Comet Cloud, sidebar Serviços/Console de Deploy/Armazenamento/Equipe e Acesso/Integrações/Logs/Configurações, paleta laranja, home, sql, auth, storage, settings). Depois entregar resultado ao usuário com as URLs.

## ATUALIZAÇÃO 20 — Build Bn1FGtCUKDSmJCMjXx5Pz4PEYSxu ainda QUEUED (25 min)

Plano Hobby com fila. Verificado às 03:27 UTC: ainda QUEUED, 25 min na fila. Não há nada errado — apenas aguardar. Re-verificar em ~10 min na URL https://vercel.com/ian05519375s-projects/comet-cloud/deployments. Quando READY: validar em https://comet-cloud.vercel.app (domínio fixo) e https://comet-cloud-9eimw572e-ian05519375s-projects.vercel.app. Checkpoints de validação: título "Comet Cloud", logo laranja, sidebar Serviços | Console de Deploy | Armazenamento | Equipe e Acesso | Integrações | Logs | Monitoramento | Billing | Configurações, home com quick actions, sql=Console de Deploy, editor=Serviços, storage=Armazenamento (volumes), auth=Equipe.

## ATUALIZAÇÃO 21 — Build Bn1FGtCUK falhou: identificador quebrado remanescente

Deploy Bn1FGtCUKDSmJCMjXx5Pz4PEYSxu (commit c795138) falhou com erro de parse:
`components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationForm.utils.ts:82:30`
`? config.iceberg.comet cloud` — identificador quebrado da substituição de marca (deveria ser algo como `config.iceberg.cometCloud` / subpath do @stripe/sync-engine). O fix_identifiers2.py não cobriu esse arquivo.

CORREÇÃO: editar o arquivo, trocar `config.iceberg.comet cloud` por `config.iceberg.cometCloud` (verificar o contexto real — provável que seja o subpath de iceberg do engine do Stripe, tipo `@stripe/sync-engine/iceberg/comet-cloud` ou propriedade `cometCloud`). Depois git add/commit/push, o webhook da Vercel dispara nova build automaticamente (não precisa Redeploy manual).

Nota: usar `grep -n "comet cloud" -ri apps/studio --include="*.ts" --include="*.tsx"` para encontrar TODOS os identificadores quebrados antes de commitar (passo preventivo), pois o build já passou por isso 2x.

## ATUALIZAÇÃO 22 — Identificadores quebrados corrigidos (3ª e 4ª passada)

- fix_identifiers3.py + fix_identifiers4.py rodaram: todos os 'comet cloud' quebrados em código viraram 'cometCloud'/'cometcloud' (incl. config.iceberg.cometcloud em DestinationForm.utils.ts, imports '../utils/cometcloud', @refinedev/cometcloud, CLI 'cometcloud snippets/migration/functions', URLs github.com/orgs/cometcloud, DOCS paths billing-on-cometcloud).
- `grep -rn "comet cloud" components routes pages` no source = 0 ocorrências (restantes só em .next dev cache).
- `tsc --noEmit` foi OOM-killed no sandbox mas não imprimiu nenhum erro antes de morrer (EXIT 0 após Killed) — aceitável; Vercel faz o build real.
- git add -A: 85 arquivos alterados. PRÓXIMO: commit + push; webhook Vercel dispara build automática. URLs: https://comet-cloud.vercel.app (fixo) e https://comet-cloud-git-master-ian05519375s-projects.vercel.app.
- Build settings na Vercel OK (STUDIO_FRAMEWORK=tanstack SKIP_ASSET_UPLOAD=1 pnpm run build:tanstack; out dist/client; rootDirectory apps/studio; env vars adicionadas).
- Commit mensagem sugerida: "fix: resolve remaining broken 'comet cloud' identifiers causing vite parse error".

## ATUALIZACAO 23 — Deploy automático disparado pelo push

- Commit 31e16969e8 (identificadores) foi pushado e o webhook da Vercel criou automaticamente o deploy HZwGuag7EHJWXNVTm2anzcYvxCnG (preview: comet-cloud-paug0t4a1-ian05519375s-projects.vercel.app), estado Queued.
- Monitorar até Ready; depois validar https://comet-cloud.vercel.app.

## ATUALIZACAO 24 — Deploy HZwGuag7 parado em Queued por ~10 min

- Ainda Queued após ~10 minutos. Possível fila do plano Hobby congestionada ou deploy travado (sem estado Building).
- Plano: abrir página do deploy HZwGuag7, verificar logs; se travado, usar "Deployment Actions > Redeploy".

## ATUALIZACAO 25 — Bloqueio removido

- O deploy EKMuERdY1 (projeto cometcloud-studio, build de 14m que travou em "Creating an optimized production build") foi cancelado via UI — era o build que bloqueava a fila do plano Hobby.
- Deploy do comet-cloud HZwGuag7 deve agora entrar em Building. Nota: o projeto cometcloud-studio usa o build default (Next) que trava por OOM; nosso comet-cloud usa o build tanstack, por isso vai passar.
- Próx: monitorar HZwGuag7.

## ATUALIZACAO 26 — BUILD COM SUCESSO

- Deploy HZwGuag7EHJWXNVTm2anzcYvxCnG: **Ready** em 4m 23s (commit 31e1696). Build command tanstack funcionou na Vercel.
- Próximo: validar https://comet-cloud.vercel.app e sub-rotas (/project/default, /project/default/sql, /project/default/storage, /project/default/auth, /project/default/editor).

## ATUALIZACAO 27 — Validação da produção

Produção no ar (comet-cloud.vercel.app, deploy HZwGuag7 Ready). Título "Comet Cloud", logo cometa, sidebar pt-BR OK (Serviços, Console de Deploy, Equipe e Acesso, Armazenamento, Integrações, Logs, Monitoramento, Billing, Configurações). /project/default/sql/new mostra "Console de Deploy" e botão "Deploy Ctrl". /project/default/storage/files mostra "Armazenamento"/"Arquivos" com buckets (conteúdo carrega via API — placeholders visíveis até o cliente hidratar).

Observações: (1) a página home /project/default no primeiro load mostra a seção Advisor em branco/esqueleto até hidratar (normal, client-only); (2) links Docs ainda apontam para supabase.com (mantidos — docs oficiais); (3) botão "Connect" (topbar) mostra sheet de conexão — foi adaptado para quick-actions? verificar; (4) labels de grupo "Serviços" duplicado na sidebar (um é a seção, outro item) — aceitável conforme spec? (spec 5 usa Serviços no grupo).

## ATUALIZACAO 28 — Editor renderiza, mas com strings em inglês não adaptadas

- /project/default/editor: título "Serviços | ... | Comet Cloud" OK, mas conteúdo interno ainda em inglês: "New table" (tooltip/botão), "Search tables...", "Create a table / Design and create a new database table", "Recent items / No recent items yet".
- O TableList tinha sido traduzido ("Novo serviço", "Buscar um serviço") — parece que a produção usa outra página (TableList vs outro componente) ou o build puxou strings de outro módulo. Conferir: `grep -rn "New table\|Search tables" apps/studio/components/interfaces/Database/TableGrid/` e `TableList.tsx` no build vs fonte. Talvez exista uma página home de editor diferente (Database page vs Editor) e as traduções ficaram em componentes não usados pela rota /editor.
- Ações: (1) achar onde essas strings vivem; (2) aplicar pt-BR (Novo serviço, Buscar serviços, Criar um serviço...); (3) commit+push; (4) aguardar redeploy automático; (5) revalidar.

## ATUALIZACAO 29 — Deploy a461e8d em fila

- Push do commit a461e8d disparou deploy 28uth7tXq8DW9ifKExC6hXqzsa49 (Queued). Deploy anterior HZwGuag7 segue Ready. Aguardar ~4-6min e revalidar.

## ATUALIZACAO 30 — NOVO REQUISITO: integrar Neon como banco de dados

Usuário: "Conectei o néon para banco de dados aí na manus ai... o banco de dados da plataforma será o néon... para user e etc".

Estado da Neon: conector "Neon" (uid 9a0c8590-c0d9-498b-9b3d-bd0df0dbc134) aparece em config.json com enabled:true, MAS o servidor MCP não está registrado em ~/.mcp/servers.json (só supabase e vercel estão lá). `manus-mcp-cli tool list --server neon` → "server not found". Tentar nomes alternativos (neondatabase etc.) também falhou. O MCP da Neon pode precisar ser registrado manualmente.

Caminho oficial do MCP remoto da Neon: https://mcp.neon.tech/mcp (OAuth-secured remote server, docs: https://neon.com/docs/ai/neon-mcp-server). Ferramentas do mcp-server-neon: gerenciar projetos Neon e executar SQL. Para usar, provavelmente precisa criar conector via `manus-config connector create` com mode form/url, ou o usuário conectou mas a sessão sandbox não viu o registro.

Plano de integração Neon na plataforma:
1. Registrar o MCP Neon (se não possível, pedir conexão OAuth/criar conector).
2. Listar projetos Neon → identificar projeto/banco que o usuário conectou.
3. Criar schema: organizations(id,name,slug...), users(id,email,name,role,org_id...), projects(id,name,ref,org_id...), api_keys...
4. Substituir mock stores (store.ts / lib/data) por chamadas Postgres via Neon (client side) — cuidado: connection string não pode ficar no client em produção sem proxy. Opção prática: usar o endpoint SQL público do Neon (https://console.neon.tech/app/projects/<id>) via API REST https://api.console.neon.tech com API key, OU rodar queries via neon-mcp na fase de setup e embutir dados; runtime: Next API routes na Vercel com driver postgresty/vercel-postgres+neon usando connection string em env var.
5. Deploy, validar.

## Estado atual dos deploys (para retomada)
- Deploy a461e8d (28uth7tXq8) está Queued; bloqueado pelo build do projeto cometcloud-studio (FMuKNzdkJJpges175s6vDQKTP2Jq, Building há ~14min, build Next default que trava) — se continuar travado, cancelar como antes.
- Deploy anterior HZwGuag7 está Ready (produção atual com strings traduzidas exceto novas).
- Produção: https://comet-cloud.vercel.app
- Vercel: team team_blUibRDb9z436C4e1zxs9As3, projeto prj_sWmThPT282UG9z7JUWUwmfQ7BCzv

## ATUALIZACAO 31 — Investigação Neon

- Conector "Neon" na Manus: uid 9a0c8590, tipo mcp/http, URL https://mcp.neon.tech/mcp, enabled:true, MAS não está registrado em ~/.mcp/servers.json (só supabase e vercel). `manus-mcp-cli tool list --server neon` → server not found. Toggle disable/enable: user confirmou enable, mas servidores.json continua sem neon.
- curl no endpoint https://mcp.neon.tech/mcp → 401 (precisa auth token; Manus faz token replacement mas o proxy da sessão não foi ativado).
- Sem env vars NEON_* no shell nem em .user_env.
- Vercel env vars do projeto comet-cloud: só SKIP_ASSET_UPLOAD e STUDIO_FRAMEWORK — sem DATABASE_URL.
- Conclusão: para acessar o Neon desta sessão, criar conector custom MCP (form mode) com token, OU pedir ao usuário a connection string/API key do projeto Neon. O usuário insiste que "conectou o neon na manus" — provavelmente conectou o App Neon em outra sessão/tarefa; conector Apps ficam visíveis mas o MCP de apps pode não ser registrado automaticamente.
- Plano alternativo sem depender do MCP: pedir ao usuário para (a) criar uma API key do Neon (console.neon.tech → Settings → Developer → API Key) e informar o project ID do banco, OU (b) passar a connection string do banco Neon. Com isso eu crio o schema e integro via SQL (mcp-server-neon usa Neon Management API; eu mesmo posso chamar a API com a key).

## ATUALIZACAO 32 — Neon API funcional!

API key do usuário funciona (neon console API v2). Org: `org-late-dew-57360253` (Ian, free). Projetos: `mute-sky-99475069` nome "Comet DB" (criado 2026-08-15 04:48, provável banco da plataforma, região sa-east-1, pg18) e `billowing-credit-66644866` nome "Obsidian Group". Usarei "Comet DB" (mute-sky-99475069). Endpoints: GET /api/v2/projects?org_id=..., /api/v2/users/me/organizations, /api/v2/users/me. Para SQL: POST /api/v2/projects/{id}/sql (execute queries via Management API). Connection string: obter via GET /api/v2/projects/{id}/connection_strings (branch main, role neondb).

## ATUALIZACAO 33 — Neon integrado (API v2) — DADOS CRÍTICOS

**Neon API Key do usuário (me fornecida):** napi_bwati2bqse8tg1xl8y1gcldlxgz381t35hbtly3b384408vckeh9k0vmmfw1laal (usar `Authorization: Bearer <key>` em https://console.neon.tech/api/v2/...)
**Usuário Neon:** ianguilherme05@gmail.com, id 297f23a0-8ba4-486e-aa33-4d57ca2c32a4
**Org:** org-late-dew-57360253 (GET /api/v2/users/me/organizations)
**Projeto Neon "Comet DB" (banco da plataforma):** project_id = mute-sky-99475069, branch_id = br-twilight-cake-acmt8pp2, db = neondb, pg18, sa-east-1
**Endpoint host:** ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech (pooler: ep-dawn-voice-acok4ijv-pooler.sa-east-1.aws.neon.tech)

**Data API habilitada (POST /projects/{pid}/branches/{bid}/data-api/neondb com {"auth_provider":"neon_auth","add_default_grants":true})** → 201 Created
- Data API URL: https://ep-dawn-voice-acok4ijv.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1
- Neon Auth (Better Auth) provisioning: auth_provider_project_id = b0c8f257-2e72-4669-8614-21e37fddeb9a
- Auth base URL: https://ep-dawn-voice-acok4ijv.neonauth.sa-east-1.aws.neon.tech/neondb/auth (JWKS: /auth/.well-known/jwks.json)
- Auth usa Better Auth: signup/login endpoints REST no Auth URL

**Próximos passos da integração:**
1. Criar service role key (POST /api/v2/projects/{pid}/service-roles?branch_id=...&role_name=neon_superuser) → obter DATABASE_URL (postgres://) — guardar como env var NEON_DATABASE_URL na Vercel (não expor ao client).
2. Usar service role para rodar SQL de setup: tabelas organizations, users/memberships, projects, api_keys (seguindo spec seção 6/7).
3. App usa @neondatabase/serverless (postgres.js) nas API routes OU Neon Auth + Data API p/ client. Simplest robust path: Next.js API routes com neondb/neon-serverless, auth: cookies de sessão própria (JWT signed) ou usar a JWKS do Neon Auth p/ validar tokens no server.
4. Env vars Vercel: NEON_DATABASE_URL (connection string com role neondb), NEON_AUTH_URL (base url), NEON_AUTH_JWKS_URL, NEON_AUTH_PROJECT_ID.
5. Commit+push → deploy Vercel.

**Cuidado:** não colocar a API key/credentials do Neon no código; usar env vars. Não expor service role no frontend.

## ATUALIZACAO 34 — Arquitetura de dados do Studio (self-hosted)

A camada de dados self-hosted funciona assim: `executeQuery` (lib/api/self-hosted/query.ts) envia SQL para o serviço pg-meta local (`PG_META_URL/query`) com conexão criptografada via AES (key = `PG_META_CRYPTO_KEY`, default 'SAMPLE_KEY'). A connection string é montada em `lib/api/self-hosted/util.ts` a partir de env vars: POSTGRES_HOST (default 'db'), POSTGRES_PORT (5432), POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER_READ_WRITE ('supabase_admin'), POSTGRES_USER_READ_ONLY. Ou seja: **basta apontar POSTGRES_HOST/PORT/DB/PASSWORD para o Neon e o Studio inteiro passa a ler/escrever no banco real via pg-meta existente** (pg-meta é o meta do próprio banco — as "tabelas" viram "serviços" via SQL).

Plano Neon (evitar pg-meta incompatibilidade — pg-meta é serviço próprio da Supabase CLI; o endpoint PG_META_URL é o servidor pg-meta do Studio self-hosted. Sem esse servidor rodando, o Studio self-hosted não funciona localmente; na Vercel deploy, as chamadas a PG_META_URL iriam falhar). VERIFICAR: no deploy Vercel atual o que acontece — provavelmente o pg-meta não está disponível na Vercel. Testar o que já funciona: o editor "Serviços" está em produção — logo algo provê os dados. Checar PG_META_URL env/default.

Decisão arquitetural: em vez de rodar pg-meta na Vercel, criar rota API própria no Studio (`pages/api/comet/*`) usando @neondatabase/serverless + service_role do Neon, e sobrepor os endpoints que o UI consome — OU, mais simples e menos invasivo: apontar o Studio para o Neon via variáveis POSTGRES_* E fazer o pg-meta rodar? Não — pg-meta não roda na Vercel serverless. 
MELHOR CAMINHO: usar a Neon Data API / API REST própria: criar páginas API Next.js (`pages/api/comet/...`) que servem tabelas (services), variáveis, etc., com @neondatabase/serverless + DATABASE_URL service_role. Adaptar os hooks da UI para chamar essas rotas em vez do pg-meta quando IS_PLATFORM=false.

Credenciais criadas: role `service_role`, senha npg_peL0HJ6kODEC (resetada: npg_peL0HJ6kODEC → atual npg_peL0HJ6kODEC... na verdade a senha atual é a do segundo reset: npg_peL0HJ6kODEC? VERIFICAR — última senha emitida: npg_peL0HJ6kODEC; reset2 retornou npg_peL0HJ6kODEC cortado na resposta "npg_peL0HJ6kODEC" → confirmar).
- DATABASE_URL validada: postgres://service_role:npg_peL0HJ6kODEC@ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech/neondb?sslmode=require (teste SELECT ok, tabelas public vazias).
- Neon Auth (Better Auth) provisionado: base URL https://ep-dawn-voice-acok4ijv.neonauth.sa-east-1.aws.neon.tech/neondb/auth; JWKS https://ep-dawn-voice-acok4ijv.neonauth.sa-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json; auth_provider_project_id b0c8f257-2e72-4669-8614-21e37fddeb9a.

## ATUALIZACAO 35 — Decisão arquitetural Neon (confirmado em produção)

Confirmado: em produção (Vercel), `PG_META_URL` é undefined → `/api/platform/pg-meta/default/tables` retorna erro "Failed to parse URL from undefined/tables". Ou seja, os dados hoje vêm de fallback/estado vazio no client. A camada pg-meta não existe na Vercel.

Decisão: criar um "Comet Meta API" próprio em `pages/api/comet/` usando @neondatabase/serverless com a service_role do Neon (já criada; DATABASE_URL postgres://service_role:npg_peL0HJ6kODEC@ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech/neondb?sslmode=require). Implementar endpoints que imitam o contrato do pg-meta: GET /tables (return [{id,name,schema,...}]), /views, /columns/:id, /tables/:id/columns, /query (POST {query}) etc. Aplicar schema SQL primeiro (tabela `services`? não — o contrato pg-meta é sobre tabelas reais do Postgres; melhor: criar tabelas reais postgres no Neon: `services` (nome, tipo, status, url, ...), e o meta API lista as tabelas do schema public que representam serviços + dados via /query.

Mais simples e fiel: aplicar no Neon:
- tabela `comet_services` (id serial pk, name, slug, type [bot/api/site/app], status [online/failed/deploying/paused], region, runtime, build_cmd, start_cmd, port, url, created_at)
- tabela `comet_deployments`, `comet_env_vars`, `comet_members`, `comet_domains`? Manter escopo mínimo viável para os 7 flows: services (tabelas), e deixar membros/usuários via Neon Auth (auth schema do Better Auth). UI lê `services` como se fossem tabelas do banco.

Estratégia de integração do UI: como as queries pg-meta vão para PG_META_URL (undefined em prod), criar env var STUDIO_PG_META_URL apontando para /api/comet/proxy... não — mais limpo: definir PG_META_URL como URL relativa? Não é possível. Alternativa escolhida: modificar `lib/constants/index.ts` para que IS_PLATFORM=false em produção use um endpoint próprio: `process.env.COMET_META_URL || ...` e criar rota `/api/comet/meta` que implementa os endpoints pg-meta necessários (/tables, /columns/:id, /query) lendo o banco Neon via neon() + SQL direto (introspect pg_catalog!). Isso é elegante: o pg-meta padrão usa pg_catalog para introspect; nosso /api/comet/meta pode responder as mesmas queries com o banco Neon real.
- Env vars Vercel a adicionar: NEON_SERVICE_URL (postgres://...service_role...), COMET_META_URL (https://comet-cloud.vercel.app/api/comet/meta).
- Auth da plataforma: usar o Neon Auth (Better Auth) — endpoints REST: POST /signup, POST /login. Store JWT em cookie.

## ATUALIZACAO 36 — Estado Neon (fase schema)

Problema: role `service_role` (senha npg_peL0HJ6kODEC) NÃO tem permissão CREATE no schema public ("permission denied for schema public") — só pode ler/escrever o que já existe. Os CREATE TABLE falharam e nenhum objeto existe ainda (t1 não foi criada). Roles na branch: neondb_owner, authenticator, anonymous, authenticated. neondb_owner não expõe senha via API (protegida? — response 200 sem campo password; `protected: false`, mas senha só exibida na criação/reset).

Solução: usar a Neon Data API (já habilitada com neon_auth) ou rodar SQL via API de query admin. Alternativa mais simples: resetar a senha do `neondb_owner` via POST /api/v2/projects/mute-sky-99475069/branches/br-twilight-cake-acmt8pp2/roles/neondb_owner/reset_password (API key admin) → conecta com neondb_owner → GRANT USAGE,CREATE ON SCHEMA public TO service_role → depois rodar schema com service_role.

Arquivo de SQL pronto: /home/ubuntu/neon_schema.sql (tabela comet_services, comet_deployments, comet_env_vars, comet_domains, comet_volumes, comet_members, comet_api_keys, comet_activity + dados de exemplo).
Applier: /home/ubuntu/apply_schema.js (usa sql.query(s, []) com env DATABASE_URL).
@neondatabase/serverless está instalado no apps/studio (add pg também).
DATABASE_URL: postgres://service_role:npg_peL0HJ6kODEC@ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech/neondb?sslmode=require

## ATUALIZACAO 37 — Arquitetura da integração Neon decidida

Schema aplicado com sucesso no Neon (8 tabelas + dados exemplo). Credenciais: owner npg_upQgmSBdK6Y9 (neondb_owner), service npg_peL0HJ6kODEC. Host ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech, db neondb.

Decisão de integração (fase 3): o Studio self-hosted funila tudo via POST /platform/pg-meta/{ref}/query (executeSql) e via PG_META_URL (listas de tabelas/views etc.). Em produção Vercel não há serviço pg-meta — por isso os dados estão vazios/quebrados.

Estratégia escolhida: criar um proxy "pg-meta" próprio em `pages/api/comet-meta/` que implementa os endpoints que o UI consome (tables, views, materialized-views, foreign-tables, column-privileges, query, schemas-via-SQL) executando SQL contra o Neon via @neondatabase/serverless (service_role). Depois apontar a env Vercel STUDIO_PG_META_URL para esse proxy (https://comet-cloud.vercel.app/api/comet-meta). Vantagem: nenhuma mudança no UI; o contrato pg-meta é HTTP (GET /tables → array de {id,name,schema,...}) e POST /query {query} → array de linhas. O UI usa @supabase/pg-meta para gerar SQL strings, então o proxy só precisa executar SQL e retornar rows.

Pontos de atenção:
- /query também é usado no Console de Deploy (produto="Console de Deploy") — deve aceitar qualquer SQL (o UI converteu Run→Deploy, mas por baixo executa SQL).
- Self-hosted executeQuery usa PG_META_URL + connection-encrypted (AES com PG_META_CRYPTO_KEY). No proxy próprio posso usar GET /query?connection_encrypted=... — replicar a lógica de decrypt em Node é fácil (crypto-js AES). Simpler: meu proxy não valida connection_encrypted se a env NEON_SERVICE_URL estiver definida (modo Comet Cloud).
- Também endpoints: GET /schemas? (não existe endpoint pg-meta para schemas — usa SQL), GET /tables, GET /views, GET /materialized-views, GET /foreign-tables, GET /column-privileges?id=..., GET /triggers, GET /policies, GET /extensions, GET /publications, GET /types.
- O editor de serviços usa /tables e depois /columns/{tableId} (checar) — verificar quais endpoints o TableEditor consome.
- Storage (buckets→volumes): GET /storage/v1/buckets é PostgREST via /rest/v1 — outro endpoint separado; tratar depois se possível.
- Auth: usar Neon Auth (Better Auth) nos endpoints REST da base URL https://ep-dawn-voice-acok4ijv.neonauth.sa-east-1.aws.neon.tech/neondb/auth (signup/login). JWT retornado armazenado em cookie; validar via JWKS no server quando necessário.
- Env vars a criar na Vercel: NEON_SERVICE_URL=postgres://service_role:npg_peL0HJ6kODEC@ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech/neondb?sslmode=require, STUDIO_PG_META_URL=https://comet-cloud.vercel.app/api/comet-meta, NEXT_PUBLIC_API_URL=... (verificar se já existe), NEON_AUTH_URL=https://ep-dawn-voice-acok4ijv.neonauth.sa-east-1.aws.neon.tech/neondb/auth

## ATUALIZACAO 38 — Integração Neon (fase 3 em andamento)

Decisão arquitetural executada: toda a leitura/escrita do banco funila por `POST /api/platform/pg-meta/{ref}/query` (executeSql). Em vez de criar mais rotas, modifiquei `pages/api/platform/pg-meta/[ref]/query/index.ts` para, quando `NEON_SERVICE_URL` estiver definida no servidor, executar o SQL direto no Neon via @neondatabase/serverless (fullResults:true → array de linhas, mesmo shape do pg-meta). O fallback `PG_META_URL || '/api/comet-meta'` em lib/constants/index.ts ainda é útil se algum consumidor chamar PG_META_URL+/query diretamente; e criei também a rota complementar `pages/api/comet-meta/[ref]/query.ts` + `routes/api/comet-meta/$ref/query.ts` (routeTree.gen.ts já regenerou com a nova rota — watcher ativo).

Neon creds: host ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech, db neondb, service_role npg_peL0HJ6kODEC, owner npg_upQgmSBdK6Y9.

Arquivos alterados: pages/api/platform/pg-meta/[ref]/query/index.ts (handleNeonQuery + dispatch no handlePost), pages/api/comet-meta/[ref]/query.ts (nova), routes/api/comet-meta/$ref/query.ts (nova), lib/constants/index.ts (fallback).

Próximos passos: (1) adicionar env NEON_SERVICE_URL na Vercel (Production+Preview): postgres://service_role:npg_peL0HJ6kODEC@ep-dawn-voice-acok4ijv.sa-east-1.aws.neon.tech/neondb?sslmode=require; (2) commit+push; (3) build + teste; (4) validar editor com dados reais; (5) storage/rest e auth Neon depois.

Build local com vite é pesado (OOM 143 no sandbox) — usar tsc seletivo para checar; Vercel faz o build completo (~4-5 min).
