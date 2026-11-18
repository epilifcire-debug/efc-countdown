-- EFC Countdown — schema inicial
-- Tabelas: profiles, user_roles, countdowns, templates, generated_files
-- Storage: bucket público countdown-gifs (escrita só na pasta do próprio usuário)

-- ---------------------------------------------------------------------------
-- Papéis
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- SECURITY DEFINER necessário: as policies consultam user_roles, que também tem RLS
-- (evita recursão). Função mínima, search_path fixo, só leitura.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create policy "user_roles: ver os próprios ou admin"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
-- Sem policies de escrita: papéis só mudam via service_role / SQL.

-- ---------------------------------------------------------------------------
-- Perfis
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: ver o próprio ou admin"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "profiles: editar o próprio"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Novo usuário: cria perfil e papel padrão 'user'.
-- O administrador principal (epilif.cire@gmail.com) recebe também 'admin'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;

  if lower(new.email) = 'epilif.cire@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Contadores
create table public.countdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('countdown', 'percentage', 'progress', 'alert')),
  title text,
  subtitle text,
  target_date date,
  target_time time,
  timezone text default 'America/Sao_Paulo',
  target_at timestamptz,
  percentage numeric(5, 2) check (percentage between 0 and 100),
  current_value numeric,
  max_value numeric check (max_value is null or max_value > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'archived')),
  template_id uuid,
  settings jsonb not null default '{}'::jsonb,
  gif_url text,
  public_id text not null unique default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.countdowns enable row level security;

create index countdowns_user_created_idx on public.countdowns (user_id, created_at desc);
create index countdowns_expiring_idx on public.countdowns (target_at)
  where type = 'countdown' and status = 'active';

create trigger countdowns_touch before update on public.countdowns
  for each row execute function public.touch_updated_at();

create policy "countdowns: ver os próprios ou admin"
  on public.countdowns for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "countdowns: criar os próprios"
  on public.countdowns for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "countdowns: editar os próprios ou admin"
  on public.countdowns for update to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'))
  with check (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "countdowns: excluir os próprios ou admin"
  on public.countdowns for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Modelos
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('countdown', 'percentage', 'progress', 'alert')),
  preview_url text,
  settings jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;

alter table public.countdowns
  add constraint countdowns_template_fk foreign key (template_id) references public.templates (id) on delete set null;
create index countdowns_template_idx on public.countdowns (template_id);
create index templates_created_by_idx on public.templates (created_by);

create policy "templates: autenticados veem públicos; admin vê todos"
  on public.templates for select to authenticated
  using (is_public or public.has_role((select auth.uid()), 'admin'));
create policy "templates: admin cria"
  on public.templates for insert to authenticated
  with check (public.has_role((select auth.uid()), 'admin'));
create policy "templates: admin edita"
  on public.templates for update to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));
create policy "templates: admin exclui"
  on public.templates for delete to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Arquivos gerados (registrados pelo servidor com service_role)
create table public.generated_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  countdown_id uuid references public.countdowns (id) on delete cascade,
  file_type text not null default 'gif',
  file_url text not null,
  file_path text not null,
  file_size integer,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);
alter table public.generated_files enable row level security;
create index generated_files_user_created_idx on public.generated_files (user_id, created_at desc);
create index generated_files_countdown_idx on public.generated_files (countdown_id);

create policy "generated_files: ver os próprios ou admin"
  on public.generated_files for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "generated_files: excluir os próprios ou admin"
  on public.generated_files for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('countdown-gifs', 'countdown-gifs', true, 10485760, array['image/gif', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "countdown-gifs: enviar na própria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'countdown-gifs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "countdown-gifs: atualizar na própria pasta"
  on storage.objects for update to authenticated
  using (bucket_id = 'countdown-gifs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "countdown-gifs: excluir na própria pasta ou admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'countdown-gifs' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or public.has_role((select auth.uid()), 'admin')));
