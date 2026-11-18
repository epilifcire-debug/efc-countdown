# EFC Countdown

Contagem regressiva, porcentagem, barra de progresso e **alerta piscando** em GIF para sites — by EFC Tecnologia.

Recriado fora do Lovable no padrão EFCSYS ([efcsys-skills](https://github.com/epilifcire-debug/efcsys-skills)).

## Arquitetura

| Parte | Tecnologia | Onde roda |
|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind | servido pelo próprio servidor |
| Servidor / gerador de GIF | Node 22 + Fastify + @napi-rs/canvas + gifenc | Shard Cloud (Dockerfile) |
| Banco, Auth, Storage | Supabase (Postgres + RLS, bucket `countdown-gifs`) | Supabase |

- `shared/render.js` — **um único renderizador** usado pelo preview (navegador) e pelo GIF (servidor). O preview é idêntico ao arquivo.
- `server/src/gif.js` — renderiza cada frame em **3x (supersampling)** com fonte vetorial, reduz com filtro de caixa, paleta global sem dithering e **otimização por diferença entre frames** (a contagem de 60 s fica com ~70 KB).
- Contagem regressiva: gerada **ao vivo** quando o GIF é aberto (cache de 5 s), sempre com o tempo real restante.
- Porcentagem, barra e alerta: salvos no Storage ao clicar em **Gerar GIF** e servidos com cache.
- Alerta: limite de **3 piscadas/s** (WCAG 2.3.1 — fotossensibilidade).

### Rotas do servidor

| Rota | Acesso | Função |
|---|---|---|
| `GET /gif/:public_id.gif` e `/media/:public_id.gif` | pública | entrega o GIF (rascunho/arquivado → 404) |
| `POST /api/gif/:id/generate` | Bearer token do usuário | gera, salva no Storage e registra em `generated_files` |
| `GET /env.js` | pública | URL e chave **pública** do Supabase para o frontend |
| `GET /health` | pública | health check |

A `service_role` existe só no servidor. O frontend usa apenas a chave pública + RLS.

## PWA (instalável no celular)

- `web/public/manifest.webmanifest`: nome, ícones normais e *maskable*, atalhos (Criar contador, Meus contadores), `display: standalone`.
- `web/public/sw.js`: assets com hash e fontes em cache; páginas com rede primeiro (fallback offline simples). **Nunca** cacheia `/api`, `/gif`, `/media`, `/env.js` nem o Supabase.
- Nova versão: aparece o aviso "Nova versão disponível → Atualizar" (sem recarregar sozinho no meio de uma edição).
- Botão **Instalar app** na barra lateral e em Configurações; no iPhone mostra o passo a passo (Safari → Compartilhar → Adicionar à Tela de Início).
- Ao mudar o `sw.js`, troque `VERSION` dentro dele para limpar o cache antigo.

## Banco (Supabase)

Migrations em `supabase/migrations/`:
1. `..._init.sql` — `profiles`, `user_roles` (`admin`/`user`), `countdowns`, `templates`, `generated_files`, RLS completa, `has_role()`, trigger de novo usuário, bucket `countdown-gifs` e policies de Storage.
2. `..._seed_templates.sql` — modelos prontos (gerado de `shared/templates.js`).

`epilif.cire@gmail.com` recebe o papel `admin` automaticamente ao se cadastrar.

## Rodar localmente

```bash
cp .env.example .env            # preencha as chaves
cd server && npm install && npm run dev      # http://localhost:8080
cd web && npm install && npm run dev         # http://localhost:5173 (proxy para o servidor)
cd server && npm run test:gif   # gera GIFs de teste em server/test-output
```

## Deploy na Shard Cloud

O repositório já vem pronto para a Shard: `.shardcloud` na raiz, `index.js` como entrada, `package.json` com as dependências do servidor e o site já compilado em `web/dist`.

1. No painel da Shard: **nova aplicação → importar do GitHub** (`epilifcire-debug/efc-countdown`) ou enviar o `.zip` do repositório.
2. Configuração (`.shardcloud`): `MAIN=index.js`, `MEMORY=512`, `SUBDOMAIN=efccountdown`. Se o subdomínio já existir, troque no arquivo antes do primeiro envio.
3. Variáveis de ambiente no painel: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_URL`. A porta vem da variável `PORT` da plataforma (padrão 80).
4. Memória: **512 MB**. Testado: 90 GIFs pedidos ao mesmo tempo ficaram em ~300 MB de pico. Tamanho máximo do GIF: 800×800 px.

Ao alterar o frontend, rode `npm run build:web` antes de enviar ao GitHub para atualizar `web/dist`. O `Dockerfile` continua disponível para hospedagens que usam imagem Docker.

No Supabase → Authentication → URL Configuration: **Site URL** = `PUBLIC_URL` e adicione `PUBLIC_URL/**` em Redirect URLs. Para "Entrar com Google", ative o provedor Google com as credenciais do Google Cloud.

---
EFC COUNTDOWN · desenvolvido por EFC Tecnologia · by: efcsys
