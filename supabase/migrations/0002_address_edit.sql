-- ============================================================
-- Address editing: snapshot on orders, soft-delete, single default.
-- Run in Supabase SQL Editor after 0001_init.sql. Idempotent.
-- ============================================================

-- ---- Soft-delete flag on addresses ----
alter table public.addresses
  add column if not exists deleted_at timestamptz;

-- ---- Address snapshot columns on orders ----
-- Filled at checkout so editing/deleting an address later never rewrites
-- a past order. Stored as text; the *_address_id columns remain for linkage.
alter table public.orders
  add column if not exists shipping_snapshot text,
  add column if not exists billing_snapshot  text;

-- ---- One default per (user, kind) ----
-- A partial unique index guarantees at most one default shipping and one
-- default billing address per user.
create unique index if not exists addresses_one_default_per_kind
  on public.addresses(user_id, kind)
  where is_default = true and deleted_at is null;

-- Helper: set an address as the default for its (user, kind), unsetting siblings.
-- SECURITY DEFINER + explicit user check so it's safe to call from the client
-- session (RLS still applies to the surrounding select the app does).
create or replace function public.set_default_address(p_address uuid, p_user uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_kind text;
begin
  select kind into v_kind
    from public.addresses
   where id = p_address and user_id = p_user and deleted_at is null;

  if v_kind is null then
    raise exception 'address not found for user';
  end if;

  -- Clear existing defaults of the same kind for this user.
  update public.addresses
     set is_default = false
   where user_id = p_user and kind = v_kind and is_default = true;

  -- Set the new default.
  update public.addresses
     set is_default = true
   where id = p_address and user_id = p_user;
end;
$$;
