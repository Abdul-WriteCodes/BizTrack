-- ══════════════════════════════════════════════════════════════════════════
-- BizTrack-OS — Auth linkage + RLS policies
-- ══════════════════════════════════════════════════════════════════════════
-- SAFE TO RUN ON THE LIVE PRODUCTION DATABASE.
--
-- This migration is purely additive:
--   • No existing table is dropped, renamed, or has columns removed.
--   • No existing row is modified.
--   • The Streamlit app keeps working unchanged — it connects with the
--     service_role key, which bypasses RLS entirely, so turning RLS on
--     below does not affect it.
--
-- What it does:
--   1. Adds a nullable `auth_user_id` column to `users`, linking each
--      legacy account to a real Supabase Auth user (auth.users.id).
--      Existing rows get NULL until a user logs into the new app for
--      the first time (see supabase/functions/legacy-login).
--   2. Adds a helper function `current_business_id()` that RLS policies
--      use to scope every query to the caller's own business.
--   3. Enables RLS and adds tenant-scoped policies on every business
--      table. Until a user has migrated (auth_user_id IS NULL), RLS
--      simply returns no rows for them under the anon/authenticated
--      client — they keep using the old app in the meantime.
-- ══════════════════════════════════════════════════════════════════════════

-- 1) Link legacy users to Supabase Auth ─────────────────────────────────────
alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_users_business_id  on public.users(business_id);

-- New sign-ups made through the Next.js app never populate the legacy
-- bcrypt column — only real Supabase Auth creates their credentials.
-- Safe no-op if it's already nullable.
alter table public.users alter column password_hash drop not null;

-- 2) Helper functions used inside RLS policies ──────────────────────────────
-- security definer so it can read `users` regardless of the caller's own
-- row-level access, but it only ever returns data derived from auth.uid().
create or replace function public.current_business_id()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select business_id from public.users where auth_user_id = auth.uid()
$$;

-- payments is keyed by user_id, not business_id (it's a flat platform
-- revenue ledger, not a per-business table like the others) — this is
-- what payments_read below actually needs.
create or replace function public.current_user_id()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select user_id from public.users where auth_user_id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- 3) Enable RLS + tenant-scoped policies ────────────────────────────────────
-- One block per table. Pattern: business_id = current_business_id(), plus
-- an admin bypass for read access where relevant (health/admin panel).

-- users ----------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth_user_id = auth.uid() or public.is_admin());

-- Lets a freshly-signed-up auth user create their own business/profile
-- row exactly once, self-linked. legacy-login and any other admin path
-- use the service role and bypass this anyway.
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth_user_id = auth.uid());

-- products ---------------------------------------------------------------
alter table public.products enable row level security;
drop policy if exists "products_tenant" on public.products;
create policy "products_tenant" on public.products
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- sales --------------------------------------------------------------------
alter table public.sales enable row level security;
drop policy if exists "sales_tenant" on public.sales;
create policy "sales_tenant" on public.sales
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- sale_items -----------------------------------------------------------
alter table public.sale_items enable row level security;
drop policy if exists "sale_items_tenant" on public.sale_items;
create policy "sale_items_tenant" on public.sale_items
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- expenses -------------------------------------------------------------
alter table public.expenses enable row level security;
drop policy if exists "expenses_tenant" on public.expenses;
create policy "expenses_tenant" on public.expenses
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- restock_log ------------------------------------------------------------
alter table public.restock_log enable row level security;
drop policy if exists "restock_log_tenant" on public.restock_log;
create policy "restock_log_tenant" on public.restock_log
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- suppliers --------------------------------------------------------------
alter table public.suppliers enable row level security;
drop policy if exists "suppliers_tenant" on public.suppliers;
create policy "suppliers_tenant" on public.suppliers
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- debts ------------------------------------------------------------------
alter table public.debts enable row level security;
drop policy if exists "debts_tenant" on public.debts;
create policy "debts_tenant" on public.debts
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- debt_payments ----------------------------------------------------------
alter table public.debt_payments enable row level security;
drop policy if exists "debt_payments_tenant" on public.debt_payments;
create policy "debt_payments_tenant" on public.debt_payments
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- cashbook_entries ---------------------------------------------------------
alter table public.cashbook_entries enable row level security;
drop policy if exists "cashbook_tenant" on public.cashbook_entries;
create policy "cashbook_tenant" on public.cashbook_entries
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- user_activity ------------------------------------------------------------
-- write-mostly audit log; tenants can read their own, admin reads all.
alter table public.user_activity enable row level security;
drop policy if exists "user_activity_read" on public.user_activity;
create policy "user_activity_read" on public.user_activity
  for select using (business_id = public.current_business_id() or public.is_admin());
drop policy if exists "user_activity_insert" on public.user_activity;
create policy "user_activity_insert" on public.user_activity
  for insert with check (business_id = public.current_business_id());

-- payments -------------------------------------------------------------
-- billing rows are sensitive; owners read their own (matched by user_id
-- — this table has no business_id column), admin reads all.
alter table public.payments enable row level security;
drop policy if exists "payments_read" on public.payments;
create policy "payments_read" on public.payments
  for select using (user_id = public.current_user_id() or public.is_admin());

-- Admin activates/renews subscriptions manually (no payment-gateway
-- webhook in this build — matches the original app's manual-approval
-- flow) and logs the platform revenue ledger entry at the same time.
drop policy if exists "payments_admin_insert" on public.payments;
create policy "payments_admin_insert" on public.payments
  for insert with check (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- NOTE: run this in the Supabase SQL editor (or `supabase db push`) against
-- the existing project — do NOT point it at a fresh project. It changes
-- nothing for the current Streamlit app.
-- ══════════════════════════════════════════════════════════════════════════
