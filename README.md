# BizTrack-OS — Next.js + Supabase (client-side, RLS) rewrite

Foundation for the rebuild: Next.js 15 (App Router, TypeScript), Tailwind v4,
Supabase Auth + RLS-secured client-side queries, packaged for the Play Store
via TWA. Targets the **same live Supabase project** you're already running
in production — nothing here creates a new project or touches existing data.

## Repo structure

```
biztrack-next/
├── README.md                          # setup + migration strategy + build order
├── .env.local.example
│
├── src/
│   ├── app/
│   │   ├── page.tsx                   # redirects → /dashboard
│   │   ├── layout.tsx                 # root layout, fonts, PWA metadata
│   │   ├── globals.css                # design tokens (ink/paper/brass palette)
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         # legacy bridge → signInWithPassword
│   │   │   └── signup/
│   │   │       ├── page.tsx           # trial signup form
│   │   │       └── actions.ts         # server action: creates users/business row
│   │   │
│   │   └── (app)/                     # authenticated shell
│   │       ├── layout.tsx             # loads profile, redirects if signed out
│   │       ├── dashboard/page.tsx     # real vertical slice — live KPIs
│   │       ├── sales/                 # cart, checkout, history, void — built
│   │       │   ├── page.tsx           # overview: KPIs + recent sales
│   │       │   ├── actions.ts         # server actions: checkout / void
│   │       │   ├── new/page.tsx + cart-builder.tsx
│   │       │   └── history/page.tsx + void-button.tsx
│   │       ├── inventory/             # products, restock, suppliers — built
│   │       │   ├── page.tsx           # products table + search + add/edit
│   │       │   ├── actions.ts         # server actions: products/restock/suppliers
│   │       │   ├── product-form.tsx
│   │       │   ├── products-table.tsx
│   │       │   ├── restock/page.tsx + restock-form.tsx
│   │       │   └── suppliers/page.tsx + suppliers-table.tsx
│   │       ├── cashbook/              # snapshot, ledger, manual entry — built
│   │       │   ├── page.tsx           # period-scoped snapshot + full ledger
│   │       │   ├── actions.ts         # server action: manual entry
│   │       │   ├── period-tabs.tsx
│   │       │   ├── add-entry-button.tsx
│   │       │   └── manual-entry-form.tsx
│   │       ├── debts/page.tsx         # stub
│   │       ├── health/page.tsx        # stub
│   │       ├── admin/page.tsx         # stub (admin-only nav link)
│   │       └── settings/billing/page.tsx  # stub
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx            # nav, role-aware
│   │   │   ├── topbar.tsx             # business name, plan status pill
│   │   │   └── sign-out-button.tsx
│   │   └── ui/
│   │       └── primitives.tsx         # Button, Input, Label, Card
│   │
│   ├── lib/
│   │   ├── countries.ts               # 25-country pricing/currency config
│   │   └── supabase/
│   │       ├── client.ts              # browser client (anon key, RLS)
│   │       ├── server.ts              # server client (RSC/Server Actions)
│   │       └── middleware.ts          # session refresh + route protection
│   │
│   ├── middleware.ts                  # wires up the Supabase session middleware
│   └── types/database.ts              # placeholder — regenerate from your project
│
└── supabase/
    ├── migrations/
    │   └── 0001_auth_link_and_rls.sql # additive: auth_user_id + RLS policies
    └── functions/
        └── legacy-login/index.ts      # bcrypt bridge → Supabase Auth
```

(Stock Next.js boilerplate — `package.json`, `next.config.ts`, `eslint.config.mjs`,
`public/*.svg` placeholder icons, `AGENTS.md`/`CLAUDE.md`, `.gitignore` — is left
out of the tree above for readability but is unchanged from `create-next-app`
defaults.)

## What's built

- **Auth migration bridge** (`supabase/functions/legacy-login`) — lets your
  current paying users log into the new app with their existing password.
  No forced resets. See "Migration strategy" below.
- **DB migration** (`supabase/migrations/0001_auth_link_and_rls.sql`) —
  purely additive: one new nullable column on `users`, RLS turned on across
  all 12 tables, tenant-scoped policies. The Streamlit app is unaffected
  (it uses the service-role key, which bypasses RLS).
- **Supabase clients** — browser, server (RSC/Server Actions), and
  middleware session refresh, all wired for the App Router.
- **Signup + login** — real Supabase Auth, with the legacy-password bridge
  on login and a server action that creates the `users` profile row
  (business_id, trial dates, country/currency) on signup.
- **App shell** — sidebar + topbar, role-aware nav, sign-out.
- **Dashboard** — first real vertical slice: today's sales, live cash
  balance, low-stock list, all pulled through RLS-scoped queries (no manual
  `business_id` filtering needed anywhere in app code).
- **Stub routes**, already inside the authenticated layout, ready to fill:
  `/sales`, `/inventory`, `/cashbook`, `/debts`, `/health`, `/admin`,
  `/settings/billing`.
- **PWA manifest** (`public/manifest.json`) for the eventual TWA wrap.

## Migration strategy (why no one gets logged out)

The old app hashes passwords with bcrypt into `users.password_hash` and
never touches Supabase Auth. RLS needs `auth.uid()`, so real accounts have
to exist in `auth.users`. Rather than forcing a password reset on your
whole user base:

1. Login form calls the `legacy-login` Edge Function first, passing the
   email/password the user just typed.
2. The function checks `users.auth_user_id`. If already set, no-op.
3. If not, it verifies the password against the legacy bcrypt hash
   (service role only — this is the one place that touches
   `password_hash`). On success it creates (or finds) the matching
   `auth.users` record **with that same password** and links it via
   `auth_user_id`.
4. The client then calls `supabase.auth.signInWithPassword()` normally,
   which now succeeds.

Net effect: existing users log in exactly as before, and get silently
migrated on their next login. New signups go straight through Supabase
Auth and never touch the bridge.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your existing project's URL + anon key
```

1. **Run the SQL migration** against your existing project (SQL editor or
   `supabase db push` with this repo linked to your project ref). Review it
   first — it's short and every statement is commented.
2. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy legacy-login --no-verify-jwt
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key>
   ```
3. **Auth settings**: in Supabase Dashboard → Authentication → Providers →
   Email, decide whether to require email confirmation. Turning it off
   keeps trial signup as frictionless as the old app (instant access);
   turning it on is more standard but adds a step new signups don't have
   today.
4. **Generate real DB types** once the migration is applied:
   ```bash
   supabase gen types typescript --project-id <ref> > src/types/database.ts
   ```
5. `npm run dev` and check `/signup` → `/login` → `/dashboard` end to end
   against a real (non-production!) account before trusting it with live
   users.

## Next steps (build order — "build all, refine after")

Each module below already has a route + RLS-scoped Supabase access ready;
what's missing is the actual UI/logic, ported from `apps/*.py`:

1. **Inventory** ✅ — products CRUD (with live margin preview), restock
   (updates stock + audit log + cashbook mirror-write), suppliers CRUD,
   low-stock badges on the dashboard and products table. Not yet ported:
   expiry-date warnings and stockout-velocity projections from the old
   `compute_insights`.
2. **Sales** ✅ — search-to-cart builder with per-line negotiated pricing
   (auto-flags a discount when unit price is dropped below the catalogue
   price), full/partial/credit payment status, partial+credit sales
   auto-create a debt, cashbook mirror-write for cash actually collected,
   pre-commit stock guard against concurrent oversells, sales history with
   void (restores stock, deletes the sale/items/cashbook entry/debt).
   Simplified vs. the original for now: sub-unit/base-unit fractional
   selling (e.g. selling 3 of 12 units in a bag) isn't ported — everything
   sells in whole base units. Void isn't PIN-gated yet (the original had a
   per-owner Void PIN setting); it's a plain confirm dialog for now. PDF
   receipts and WhatsApp share aren't built — `/sales/new` shows an
   on-screen confirmation only.
3. **Cashbook** ✅ — snapshot (opening/in/out/closing balance) for
   Today/This week/This month/All time, payment-method composition,
   entry-type breakdown, manual entry (owner drawings, capital top-ups,
   bank deposits), full ledger. Reads the same `cashbook_entries` rows
   Sales and Inventory already mirror-write into — nothing new to wire up
   there.
4. **Debts** — ledger + part-payments
5. **Business health** — expense tracking, trend charts (`recharts` is
   already installed)
6. **Billing** — Flutterwave links per country/plan, webhook → Edge
   Function (service role) to flip `plan_status`, since that write must
   never happen from the client
7. **Admin panel** — cross-tenant views, gated by `is_admin()` (already in
   the RLS migration)

## TWA / Play Store packaging (once the PWA is solid)

1. Add real PNG icons to `public/icons/` (192, 512, and a 512 maskable) —
   currently referenced in `manifest.json` but not generated yet.
2. Deploy the Next.js app (Vercel or similar) on your real domain — TWA
   needs a live HTTPS origin with the manifest served correctly.
3. Use Bubblewrap (github.com/GoogleChromeLabs/bubblewrap) or PWABuilder to
   generate the Android project from the deployed manifest URL, sign it,
   and upload to Play Console. This replaces the Capacitor WebView wrapper
   you were using before — no more same-domain/navigation quirks, since TWA
   renders the real installed PWA.
