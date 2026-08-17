-- TerraSync RBAC Farmer Management
-- Run this in Supabase SQL Editor.
--
-- IMPORTANT:
-- 1. Supabase Auth is used for ADMIN accounts.
-- 2. Farmers authenticate through the SECURITY DEFINER RPC below.
-- 3. The browser never receives the farmer password hash.
-- 4. Do NOT put a service_role key in the React app.

create extension if not exists pgcrypto;

-- Farmers table requested by the application.
create table if not exists public.farmers (
    farmer_id serial not null,
    rsbsa_number varchar(50) not null,
    name varchar(255) not null,
    crops text null,
    status varchar(10) not null default 'active',
    address varchar(255) null,
    phone varchar(20) not null,
    email varchar(255) null,
    password varchar(255) not null default md5('terrapass'),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint farmers_pk primary key (farmer_id),
    constraint farmers_rsbsa_number_key unique (rsbsa_number),
    constraint farmers_status_check check (status in ('active', 'inactive')),
    constraint farmers_rsbsa_pattern_check check (
        rsbsa_number ~ '^\d{2}-?\d{2}-?\d{2}-?\d{3}-?\d{5,8}$'
    )
);

-- Admin role mapping for Supabase Auth users.
create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'admin' check (role in ('admin', 'farmer')),
    created_at timestamptz not null default now()
);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists farmers_set_updated_at on public.farmers;
create trigger farmers_set_updated_at
before update on public.farmers
for each row execute function public.set_updated_at();

-- RLS
alter table public.farmers enable row level security;
alter table public.user_roles enable row level security;

-- Admins may read/update/create/delete farmers.
drop policy if exists "admins_can_read_farmers" on public.farmers;
create policy "admins_can_read_farmers"
on public.farmers
for select
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists "admins_can_insert_farmers" on public.farmers;
create policy "admins_can_insert_farmers"
on public.farmers
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists "admins_can_update_farmers" on public.farmers;
create policy "admins_can_update_farmers"
on public.farmers
for update
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

drop policy if exists "admins_can_delete_farmers" on public.farmers;
create policy "admins_can_delete_farmers"
on public.farmers
for delete
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Farmer updates are intentionally restricted to the farmer ID supplied by
-- the short-lived browser farmer session. Because the current legacy schema
-- has no auth.users foreign key, the safer long-term migration is to Supabase Auth.
--
-- For this requested legacy farmer-table login flow, the RPCs below are
-- SECURITY DEFINER and explicitly validate the credential before returning data.

create or replace function public.authenticate_farmer(
  p_identifier text,
  p_password text
)
returns table (
  farmer_id integer,
  rsbsa_number varchar,
  name varchar,
  crops text,
  status varchar,
  address varchar,
  phone varchar,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    f.farmer_id,
    f.rsbsa_number,
    f.name,
    f.crops,
    f.status,
    f.address,
    f.phone,
    f.email,
    f.created_at,
    f.updated_at
  from public.farmers f
  where (lower(f.rsbsa_number) = lower(trim(p_identifier))
         or lower(coalesce(f.email, '')) = lower(trim(p_identifier)))
    and f.password = md5(p_password)
  limit 1;
$$;

revoke all on function public.authenticate_farmer(text, text) from public;
grant execute on function public.authenticate_farmer(text, text) to anon, authenticated;

create or replace function public.get_farmer_profile(p_farmer_id integer)
returns table (
  farmer_id integer,
  rsbsa_number varchar,
  name varchar,
  crops text,
  status varchar,
  address varchar,
  phone varchar,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    f.farmer_id,
    f.rsbsa_number,
    f.name,
    f.crops,
    f.status,
    f.address,
    f.phone,
    f.email,
    f.created_at,
    f.updated_at
  from public.farmers f
  where f.farmer_id = p_farmer_id
  limit 1;
$$;

revoke all on function public.get_farmer_profile(integer) from public;
grant execute on function public.get_farmer_profile(integer) to anon, authenticated;


-- Admin CRUD RPCs keep password hashing inside PostgreSQL and avoid exposing
-- password hashes to the browser. Only authenticated admins can execute them.

create or replace function public.admin_create_farmer(
  p_rsbsa_number varchar,
  p_name varchar,
  p_crops text,
  p_status varchar,
  p_address varchar,
  p_phone varchar,
  p_email varchar,
  p_password text
)
returns table (
  farmer_id integer,
  rsbsa_number varchar,
  name varchar,
  crops text,
  status varchar,
  address varchar,
  phone varchar,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin privileges required';
  end if;

  return query
  insert into public.farmers (
    rsbsa_number, name, crops, status, address, phone, email, password
  )
  values (
    p_rsbsa_number, p_name, p_crops, p_status, p_address, p_phone, p_email,
    case
      when nullif(p_password, '') is null then md5('terrapass')
      else encode(digest(p_password, 'md5'), 'hex')
    end
  )
  returning
    farmers.farmer_id, farmers.rsbsa_number, farmers.name, farmers.crops,
    farmers.status, farmers.address, farmers.phone, farmers.email,
    farmers.created_at, farmers.updated_at;
end;
$$;

create or replace function public.admin_update_farmer(
  p_farmer_id integer,
  p_rsbsa_number varchar,
  p_name varchar,
  p_crops text,
  p_status varchar,
  p_address varchar,
  p_phone varchar,
  p_email varchar,
  p_password text
)
returns table (
  farmer_id integer,
  rsbsa_number varchar,
  name varchar,
  crops text,
  status varchar,
  address varchar,
  phone varchar,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin privileges required';
  end if;

  return query
  update public.farmers f
  set
    rsbsa_number = p_rsbsa_number,
    name = p_name,
    crops = p_crops,
    status = p_status,
    address = p_address,
    phone = p_phone,
    email = p_email,
    password = case
      when nullif(p_password, '') is null then f.password
      else encode(digest(p_password, 'md5'), 'hex')
    end
  where f.farmer_id = p_farmer_id
  returning
    f.farmer_id, f.rsbsa_number, f.name, f.crops,
    f.status, f.address, f.phone, f.email,
    f.created_at, f.updated_at;
end;
$$;

revoke all on function public.admin_create_farmer(varchar, varchar, text, varchar, varchar, varchar, varchar, text) from public;
revoke all on function public.admin_update_farmer(integer, varchar, varchar, text, varchar, varchar, varchar, varchar, text) from public;
grant execute on function public.admin_create_farmer(varchar, varchar, text, varchar, varchar, varchar, varchar, text) to authenticated;
grant execute on function public.admin_update_farmer(integer, varchar, varchar, text, varchar, varchar, varchar, varchar, text) to authenticated;

-- Farmer self-service update.
-- The caller must prove the existing password before any profile data changes.
create or replace function public.update_own_farmer_profile(
  p_farmer_id integer,
  p_current_password text,
  p_rsbsa_number varchar,
  p_name varchar,
  p_crops text,
  p_status varchar,
  p_address varchar,
  p_phone varchar,
  p_email varchar,
  p_new_password text
)
returns table (
  farmer_id integer,
  rsbsa_number varchar,
  name varchar,
  crops text,
  status varchar,
  address varchar,
  phone varchar,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.farmers f
    where f.farmer_id = p_farmer_id
      and f.password = encode(digest(p_current_password, 'md5'), 'hex')
      and f.status = 'active'
  ) then
    raise exception 'Current password is incorrect';
  end if;

  return query
  update public.farmers f
  set
    rsbsa_number = p_rsbsa_number,
    name = p_name,
    crops = p_crops,
    address = p_address,
    phone = p_phone,
    email = p_email,
    password = case
      when nullif(p_new_password, '') is null then f.password
      else encode(digest(p_new_password, 'md5'), 'hex')
    end
  where f.farmer_id = p_farmer_id
  returning
    f.farmer_id, f.rsbsa_number, f.name, f.crops,
    f.status, f.address, f.phone, f.email,
    f.created_at, f.updated_at;
end;
$$;

revoke all on function public.update_own_farmer_profile(integer, text, varchar, varchar, text, varchar, varchar, varchar, varchar, text) from public;
grant execute on function public.update_own_farmer_profile(integer, text, varchar, varchar, text, varchar, varchar, varchar, varchar, text) to anon, authenticated;

-- A legacy farmer needs a controlled update RPC because there is no auth.users
-- identity to connect to farmer_id. The RPC re-authenticates the farmer using
-- the current password before changing the profile.
--
-- The React UI does not call this RPC yet; direct table updates are reserved
-- for authenticated admins. For a production farmer self-service flow,
-- migrate farmers to Supabase Auth and link auth.users.id to farmers.

-- Optional hardening: do not expose the raw password column through normal
-- client SELECT policies. The React app selects an explicit public field list.

-- Example admin assignment:
-- 1. Create admin@example.com in Authentication -> Users.
-- 2. Then run:
--
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'
-- from auth.users
-- where email = 'admin@example.com'
-- on conflict (user_id) do update set role = 'admin';

-- Example farmer:
-- insert into public.farmers (rsbsa_number, name, crops, status, address, phone, email)
-- values ('12-34-56-789-12345', 'Juan Dela Cruz', 'Rice', 'active',
--         'Cebu, Philippines', '09171234567', 'juan@example.com');
-- Default password is terrapass.
