-- DA YI Operations Management Supabase schema
-- Run this in the Supabase SQL editor before deploying the React app.

create extension if not exists pgcrypto;

create table if not exists public.app_roles (
  id text primary key,
  name_en text not null,
  name_zh text not null,
  description text default '',
  module_ids text[] not null default '{}',
  is_super_admin boolean not null default false,
  can_manage_users boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role_id text not null references public.app_roles(id),
  whatsapp text default '',
  wechat text default '',
  active boolean not null default true,
  created_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  title text not null,
  status text not null default 'not_started',
  risk text not null default 'medium',
  owner_user_id uuid references public.app_users(id),
  approver_user_id uuid references public.app_users(id),
  support_user_id uuid references public.app_users(id),
  deadline date,
  contingency text default '',
  notes text default '',
  data jsonb not null default '{}',
  created_by uuid references public.app_users(id),
  updated_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.app_users(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at
before update on public.app_users
for each row execute function public.touch_updated_at();

drop trigger if exists records_touch_updated_at on public.records;
create trigger records_touch_updated_at
before update on public.records
for each row execute function public.touch_updated_at();

insert into public.app_roles (id, name_en, name_zh, module_ids, is_super_admin, can_manage_users, sort_order)
values
  ('super_admin', 'CEO / Super Admin', 'CEO / 超级管理员', array['organization','documents','procurement','warehouse','production','sales','finance','import_export','logistics','hr','maintenance','lab','affairs'], true, true, 1),
  ('general_manager', 'General Manager', '总经理', array['organization','documents','procurement','warehouse','production','sales','import_export','logistics','hr','maintenance','lab','affairs'], false, false, 2),
  ('procurement_manager', 'Procurement Manager', '采购经理', array['procurement','warehouse','import_export'], false, false, 3),
  ('warehouse_manager', 'Warehouse Supervisor', '仓库主管', array['warehouse','procurement','logistics'], false, false, 4),
  ('production_manager', 'Production Manager', '生产经理', array['production','warehouse','maintenance','lab'], false, false, 5),
  ('qc_manager', 'QC / Lab Manager', '质量/实验室负责人', array['lab','production','documents'], false, false, 6),
  ('sales_manager', 'Sales Manager', '销售经理', array['sales','warehouse','logistics'], false, false, 7),
  ('finance_manager', 'Finance Manager', '财务经理', array['finance','procurement','sales','import_export'], false, false, 8),
  ('import_export_manager', 'Import/Export Manager', '进出口负责人', array['import_export','procurement','warehouse','logistics'], false, false, 9),
  ('logistics_coordinator', 'Logistics Coordinator', '物流运输协调', array['logistics','warehouse','sales'], false, false, 10),
  ('hr_admin', 'HR Admin', '人事行政', array['hr','organization','documents'], false, false, 11),
  ('maintenance_supervisor', 'Maintenance Supervisor', '设备维护主管', array['maintenance','production','warehouse'], false, false, 12)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  module_ids = excluded.module_ids,
  is_super_admin = excluded.is_super_admin,
  can_manage_users = excluded.can_manage_users,
  sort_order = excluded.sort_order;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.app_users where auth_user_id = auth.uid() and active = true limit 1
$$;

create or replace function public.current_role_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(r.is_super_admin, false)
  from public.app_users u
  join public.app_roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid() and u.active = true
  limit 1
$$;

create or replace function public.current_role_can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(r.can_manage_users or r.is_super_admin, false)
  from public.app_users u
  join public.app_roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid() and u.active = true
  limit 1
$$;

create or replace function public.current_role_can_access_module(p_module_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(r.is_super_admin or r.module_ids @> array[p_module_id], false)
  from public.app_users u
  join public.app_roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid() and u.active = true
  limit 1
$$;

alter table public.app_roles enable row level security;
alter table public.app_users enable row level security;
alter table public.records enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "roles readable by authenticated users" on public.app_roles;
create policy "roles readable by authenticated users"
on public.app_roles for select
to authenticated
using (true);

drop policy if exists "users readable by permitted users" on public.app_users;
create policy "users readable by permitted users"
on public.app_users for select
to authenticated
using (
  public.current_role_is_super_admin()
  or public.current_role_can_manage_users()
  or (public.current_app_user_id() is not null and active = true)
  or id = public.current_app_user_id()
);

drop policy if exists "users update by permitted users" on public.app_users;
create policy "users update by permitted users"
on public.app_users for update
to authenticated
using (
  public.current_role_is_super_admin()
  or public.current_role_can_manage_users()
  or id = public.current_app_user_id()
)
with check (
  public.current_role_is_super_admin()
  or public.current_role_can_manage_users()
  or id = public.current_app_user_id()
);

drop policy if exists "records readable by role or assignment" on public.records;
create policy "records readable by role or assignment"
on public.records for select
to authenticated
using (
  public.current_role_is_super_admin()
  or public.current_role_can_access_module(module_id)
  or owner_user_id = public.current_app_user_id()
  or approver_user_id = public.current_app_user_id()
  or support_user_id = public.current_app_user_id()
);

drop policy if exists "records insert by role" on public.records;
create policy "records insert by role"
on public.records for insert
to authenticated
with check (
  public.current_role_is_super_admin()
  or public.current_role_can_access_module(module_id)
);

drop policy if exists "records update by role or assignment" on public.records;
create policy "records update by role or assignment"
on public.records for update
to authenticated
using (
  public.current_role_is_super_admin()
  or public.current_role_can_access_module(module_id)
  or owner_user_id = public.current_app_user_id()
  or approver_user_id = public.current_app_user_id()
  or support_user_id = public.current_app_user_id()
)
with check (
  public.current_role_is_super_admin()
  or public.current_role_can_access_module(module_id)
  or owner_user_id = public.current_app_user_id()
  or approver_user_id = public.current_app_user_id()
  or support_user_id = public.current_app_user_id()
);

drop policy if exists "records delete by super admin" on public.records;
create policy "records delete by super admin"
on public.records for delete
to authenticated
using (public.current_role_is_super_admin());

drop policy if exists "audit readable by super admin" on public.audit_logs;
create policy "audit readable by super admin"
on public.audit_logs for select
to authenticated
using (public.current_role_is_super_admin());
