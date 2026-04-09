# Deploy na Vercel

## 1) Pré-requisitos
- Repositório no GitHub (`kaizen-website`)
- Projeto Supabase com as tabelas já criadas

## 2) Variáveis de ambiente na Vercel
No painel da Vercel (`Project > Settings > Environment Variables`), configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (URL final do projeto na Vercel)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (opcional)
- `NEXT_PUBLIC_GA_ID` (opcional)
- `SUPABASE_SERVICE_ROLE_KEY` (somente se você realmente usar funções server com essa chave)

Use os mesmos valores do arquivo `.env.local` local (com a URL de produção no `NEXT_PUBLIC_SITE_URL`).

## 3) Importar projeto
1. Acesse https://vercel.com/new
2. Selecione o repositório `kaizen-website`
3. Framework detectado: **Next.js**
4. Build command: `next build` (já compatível)
5. Output directory: padrão da Vercel (não alterar)

## 4) Deploy
- Clique em **Deploy**
- Após concluir, valide:
  - `/`
  - `/sobre`
  - `/imoveis`
  - `/contato`
  - painel `/admin`

## 5) Domínio customizado (opcional)
- `Project > Settings > Domains`
- Atualize `NEXT_PUBLIC_SITE_URL` para o domínio final
