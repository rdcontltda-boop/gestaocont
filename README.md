# Portal do Cliente — RD Contabilidade

App web (PWA) onde cada cliente do escritório acessa **só a empresa dele** e encontra:

- **Guias e boletos** publicados pelo escritório (DAS, DARF, FGTS, INSS, ISS, honorários), com valor, vencimento e status
- **Pix e boleto com um toque**: QR Code gerado na hora a partir do código Pix, e botão de copiar para o código Pix e para a linha digitável
- **Documentos da empresa**, organizados por categoria e competência, com marcação de "novo" e registro de quem já abriu
- **Calendário** do mês com os vencimentos e os documentos da competência
- **Painel do escritório** para publicar guias, enviar documentos e cadastrar empresas

Instalável na tela inicial do celular (Android e iOS) sem passar por loja de aplicativos.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Interface | React 18 + TypeScript + Vite + Tailwind CSS |
| Login, banco e arquivos | Supabase (Auth + Postgres + Storage) |
| Hospedagem | Vercel |

## Como o isolamento entre clientes funciona

A proteção **não** está no código do navegador — está no banco. Todas as tabelas
usam Row Level Security, e o cliente só consegue ler linhas das empresas
vinculadas a ele na tabela `acessos`. Mesmo que alguém adultere o JavaScript da
página, o Postgres devolve conjunto vazio.

Os arquivos ficam num bucket **privado**. Nada é servido por URL pública: o app
gera uma URL assinada com validade de 1 hora no momento em que o cliente clica.

A chave `anon` do Supabase é pública por natureza (ela vai no navegador de
qualquer jeito) e isso não é um problema — quem controla o acesso são as
policies. A chave `service_role` **nunca** entra neste projeto.

## Rodando na sua máquina

```bash
npm install
cp .env.example .env      # preencha com os dados do seu projeto Supabase
npm run dev
```

Há uma página de conferência visual dos componentes, com dados fictícios e sem
necessidade de login, em `http://localhost:5173/demo.html`.

Scripts disponíveis:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run typecheck` | Só a checagem de tipos |

## Configuração do Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito atende).
2. Em **SQL Editor**, cole e rode o conteúdo de `supabase/migrations/0001_init.sql`.
   Isso cria as tabelas, as policies de RLS e o bucket privado `arquivos`.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon*
   para o seu `.env`.
4. Em **Authentication → Providers**, deixe só **Email** ativo e desligue
   "Enable email signups" — quem cria acesso é o escritório, não há
   autocadastro.

### Criando o primeiro usuário administrador

1. **Authentication → Users → Add user**: informe e-mail e senha e marque
   *Auto Confirm User*.
2. Em **SQL Editor**, promova esse usuário a administrador:

   ```sql
   update public.perfis
   set papel = 'admin', nome = 'Seu nome'
   where id = (select id from auth.users where email = 'voce@rdcont.net.br');
   ```

Pronto: ao entrar no app, o botão **Painel** aparece e você já consegue
cadastrar empresas, publicar guias e enviar documentos.

### Criando o acesso de um cliente

1. Cadastre a empresa no app, em **Painel → Nova empresa**.
2. **Authentication → Users → Add user**: e-mail e senha do cliente, com
   *Auto Confirm User* marcado.
3. Vincule o usuário à empresa:

   ```sql
   insert into public.acessos (perfil_id, empresa_id)
   select
     (select id from auth.users where email = 'cliente@empresa.com.br'),
     (select id from public.empresas where cnpj = '00000000000000');
   ```

Um mesmo usuário pode ter acesso a várias empresas — basta inserir mais de uma
linha em `acessos`. Nesse caso, um seletor de empresa aparece no topo do app.

## Publicando na Vercel

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe este
   repositório do GitHub.
2. A Vercel detecta o Vite sozinha. Confirme:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Em **Environment Variables**, cadastre as duas variáveis do `.env`
   (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). Sem elas o app não sobe.
4. **Deploy**. A partir daí, todo push no branch de produção publica sozinho.

### Domínio próprio

Em **Settings → Domains** na Vercel, adicione o subdomínio (ex.:
`app.rdcont.com.br`). A Vercel mostra o registro DNS a criar. O domínio pode
continuar registrado na Hostinger — muda só o apontamento, no painel de DNS.
O certificado HTTPS é emitido automaticamente.

## Estrutura

```
src/
  components/    Peças reutilizáveis (lista de cobranças, modal de pagamento, QR do Pix)
  hooks/         useAuth (sessão, perfil, empresa ativa) e useDados (consultas)
  lib/           Cliente Supabase, tipos e formatações (moeda, datas, CNPJ, boleto)
  pages/         Login, Início, Guias, Documentos, Calendário, Painel
supabase/
  migrations/    Schema e policies de RLS
```

## Notas de segurança e LGPD

- O portal **não** guarda senhas de acesso do cliente a órgãos públicos nem
  senha de certificado digital. Guardar credenciais de terceiros no mesmo banco
  que atende o portal amplia demais o impacto de um vazamento. Se o escritório
  precisar disso, use um cofre de senhas separado.
- `visto_em` registra quando o cliente abriu um documento pela primeira vez.
  Serve como comprovação de entrega — vale avisar o cliente disso na política
  de privacidade.
- Os arquivos nunca ficam em URL pública; o acesso é sempre por link assinado
  de curta duração.
