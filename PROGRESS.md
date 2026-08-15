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
