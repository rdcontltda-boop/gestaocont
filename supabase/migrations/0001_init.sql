-- ============================================================
-- Portal do Cliente - RD Contabilidade
-- Migration 0001: estrutura inicial + isolamento por empresa (RLS)
-- ============================================================
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------

-- Empresas atendidas pelo escritorio (os clientes da contabilidade)
create table if not exists public.empresas (
  id                uuid primary key default gen_random_uuid(),
  razao_social      text not null,
  nome_fantasia     text,
  cnpj              text not null unique,
  regime_tributario text check (regime_tributario in ('mei','simples','presumido','real')),
  ativo             boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Perfil de cada usuario logado. 1:1 com auth.users.
create table if not exists public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null default '',
  papel      text not null default 'cliente' check (papel in ('admin','cliente')),
  telefone   text,
  created_at timestamptz not null default now()
);

-- Quais empresas cada usuario cliente pode ver.
-- Um contador (papel=admin) ve todas e nao precisa de linha aqui.
create table if not exists public.acessos (
  perfil_id  uuid not null references public.perfis(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (perfil_id, empresa_id)
);

-- Guias, boletos e honorarios publicados para a empresa
create table if not exists public.cobrancas (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  tipo            text not null default 'outro'
                    check (tipo in ('das','darf','fgts','inss','iss','honorarios','outro')),
  descricao       text not null,
  competencia     date,           -- sempre dia 1 do mes de referencia
  vencimento      date not null,
  valor           numeric(14,2) not null check (valor >= 0),
  status          text not null default 'aberto'
                    check (status in ('aberto','pago','cancelado')),
  pago_em         date,
  pix_copia_cola  text,           -- BR Code (Pix copia e cola) - o QR e gerado no app
  linha_digitavel text,           -- linha digitavel do boleto
  arquivo_path    text,           -- caminho no storage (PDF da guia)
  observacoes     text,
  criado_por      uuid references public.perfis(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Documentos da empresa disponibilizados pelo escritorio
create table if not exists public.documentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  titulo        text not null,
  categoria     text not null default 'outro'
                  check (categoria in ('fiscal','contabil','folha','societario','certidao','outro')),
  competencia   date,
  arquivo_path  text not null,
  tamanho_bytes bigint,
  visto_em      timestamptz,      -- primeira vez que o cliente abriu
  criado_por    uuid references public.perfis(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists cobrancas_empresa_venc_idx
  on public.cobrancas (empresa_id, vencimento desc);
create index if not exists documentos_empresa_idx
  on public.documentos (empresa_id, created_at desc);
create index if not exists acessos_perfil_idx
  on public.acessos (perfil_id);

-- ------------------------------------------------------------
-- Funcoes auxiliares
--
-- SECURITY DEFINER de proposito: estas funcoes sao chamadas de
-- dentro das policies e precisam ler perfis/acessos ignorando o
-- RLS dessas mesmas tabelas. Sem isso a policy chamaria a si
-- mesma e o Postgres aborta por recursao infinita.
-- ------------------------------------------------------------

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin'
  );
$$;

create or replace function public.tem_acesso(alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.e_admin() or exists (
    select 1 from public.acessos
    where perfil_id = auth.uid() and empresa_id = alvo
  );
$$;

-- Cria o perfil automaticamente quando um usuario e criado no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.empresas   enable row level security;
alter table public.perfis     enable row level security;
alter table public.acessos    enable row level security;
alter table public.cobrancas  enable row level security;
alter table public.documentos enable row level security;

-- perfis: cada um le/edita o proprio; admin le todos.
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
  for select using (id = auth.uid() or public.e_admin());

drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis
  for update using (id = auth.uid() or public.e_admin())
  with check (id = auth.uid() or public.e_admin());

drop policy if exists perfis_admin_all on public.perfis;
create policy perfis_admin_all on public.perfis
  for all using (public.e_admin()) with check (public.e_admin());

-- empresas: cliente ve so as que tem acesso; admin faz tudo.
drop policy if exists empresas_select on public.empresas;
create policy empresas_select on public.empresas
  for select using (public.tem_acesso(id));

drop policy if exists empresas_admin_all on public.empresas;
create policy empresas_admin_all on public.empresas
  for all using (public.e_admin()) with check (public.e_admin());

-- acessos: cliente ve os proprios vinculos; admin gerencia.
drop policy if exists acessos_select on public.acessos;
create policy acessos_select on public.acessos
  for select using (perfil_id = auth.uid() or public.e_admin());

drop policy if exists acessos_admin_all on public.acessos;
create policy acessos_admin_all on public.acessos
  for all using (public.e_admin()) with check (public.e_admin());

-- cobrancas: leitura restrita a empresa do cliente; escrita so admin.
drop policy if exists cobrancas_select on public.cobrancas;
create policy cobrancas_select on public.cobrancas
  for select using (public.tem_acesso(empresa_id));

drop policy if exists cobrancas_admin_all on public.cobrancas;
create policy cobrancas_admin_all on public.cobrancas
  for all using (public.e_admin()) with check (public.e_admin());

-- documentos: mesma regra.
drop policy if exists documentos_select on public.documentos;
create policy documentos_select on public.documentos
  for select using (public.tem_acesso(empresa_id));

drop policy if exists documentos_admin_all on public.documentos;
create policy documentos_admin_all on public.documentos
  for all using (public.e_admin()) with check (public.e_admin());

-- O cliente pode marcar um documento como visto (e so isso).
drop policy if exists documentos_marcar_visto on public.documentos;
create policy documentos_marcar_visto on public.documentos
  for update using (public.tem_acesso(empresa_id))
  with check (public.tem_acesso(empresa_id));

-- ------------------------------------------------------------
-- Storage
-- Bucket privado. O caminho SEMPRE comeca com o id da empresa:
--   <empresa_id>/cobrancas/<arquivo>
--   <empresa_id>/documentos/<arquivo>
-- A policy le a primeira pasta do caminho e confere o acesso.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

drop policy if exists arquivos_select on storage.objects;
create policy arquivos_select on storage.objects
  for select using (
    bucket_id = 'arquivos'
    and public.tem_acesso(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists arquivos_admin_all on storage.objects;
create policy arquivos_admin_all on storage.objects
  for all using (bucket_id = 'arquivos' and public.e_admin())
  with check (bucket_id = 'arquivos' and public.e_admin());
