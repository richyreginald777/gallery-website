-- ============================================================
-- Art e-commerce schema
-- Run this in Supabase dashboard > SQL Editor, or via the CLI.
-- ============================================================

-- ---------- Enums ----------
create type artwork_status as enum ('available', 'reserved', 'sold');
create type order_status   as enum ('created', 'paid', 'shipped', 'cancelled');

-- ---------- Profiles (1:1 with auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Addresses (a user can save several) ----------
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'shipping',   -- 'shipping' | 'billing'
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  postal_code text not null,
  country     text not null default 'IN',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_user_idx on public.addresses(user_id);

-- ---------- Artworks ----------
create table public.artworks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  medium       text,
  dimensions   text,
  price_inr    integer not null check (price_inr > 0),  -- whole rupees
  image_path   text,                                    -- path in the 'artworks' storage bucket
  status       artwork_status not null default 'available',
  -- Reservation tracking. When a payment link is created we set reserved_until.
  -- A background sweep (or lazy check) releases the lock if it lapses unpaid.
  reserved_by      uuid references auth.users(id) on delete set null,
  reserved_until   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index artworks_status_idx on public.artworks(status);

-- ---------- Orders ----------
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete restrict,
  artwork_id          uuid not null references public.artworks(id) on delete restrict,
  amount_inr          integer not null check (amount_inr > 0),
  status              order_status not null default 'created',
  shipping_address_id uuid references public.addresses(id),
  billing_address_id  uuid references public.addresses(id),
  -- Razorpay linkage
  razorpay_payment_link_id text,
  razorpay_payment_id      text,
  utr                       text,           -- captured from webhook, for the artist's records
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  shipped_at          timestamptz
);
create index orders_user_idx on public.orders(user_id);
create index orders_artwork_idx on public.orders(artwork_id);
create unique index orders_payment_link_uidx
  on public.orders(razorpay_payment_link_id)
  where razorpay_payment_link_id is not null;

-- ============================================================
-- Reservation helpers (close the inventory-freeze exploit)
-- ============================================================

-- Atomically reserve an artwork for `p_user` for `p_minutes`.
-- Succeeds only if the item is available, OR already reserved but the hold lapsed.
-- Returns true on success, false if someone else holds a live reservation.
create function public.reserve_artwork(p_artwork uuid, p_user uuid, p_minutes int default 15)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  ok boolean;
begin
  update public.artworks a
     set status         = 'reserved',
         reserved_by    = p_user,
         reserved_until = now() + make_interval(mins => p_minutes),
         updated_at     = now()
   where a.id = p_artwork
     and (
       a.status = 'available'
       or (a.status = 'reserved' and (a.reserved_until is null or a.reserved_until < now()))
     )
  returning true into ok;

  return coalesce(ok, false);
end;
$$;

-- Release expired reservations back to 'available'. Call from a cron/sweep,
-- or rely on reserve_artwork() reclaiming lapsed holds lazily.
create function public.release_expired_reservations()
returns int
language plpgsql
security definer set search_path = public
as $$
declare n int;
begin
  with upd as (
    update public.artworks
       set status = 'available', reserved_by = null, reserved_until = null, updated_at = now()
     where status = 'reserved' and reserved_until is not null and reserved_until < now()
     returning 1
  )
  select count(*) into n from upd;
  return n;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.addresses enable row level security;
alter table public.artworks  enable row level security;
alter table public.orders    enable row level security;

-- Profiles: a user sees and edits only their own.
create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- Addresses: owner-only, full CRUD.
create policy "addresses owner all" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Artworks: anyone (even anonymous) can read; writes go through the service role
-- (admin panel uses server-side service-role client), so no public write policy.
create policy "artworks public read" on public.artworks for select using (true);

-- Orders: a user reads only their own. Inserts happen server-side; we still allow
-- the owner to insert their own row defensively. Updates are service-role only.
create policy "orders owner read"   on public.orders for select using (auth.uid() = user_id);
create policy "orders owner insert" on public.orders for insert with check (auth.uid() = user_id);

-- NOTE: the service-role key bypasses RLS entirely; the webhook and admin actions
-- use it to update artworks/orders. Never ship that key to the browser.

-- ============================================================
-- Storage bucket for artwork images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

-- Public read of images; uploads are done server-side with the service role.
create policy "artwork images public read"
  on storage.objects for select
  using (bucket_id = 'artworks');
