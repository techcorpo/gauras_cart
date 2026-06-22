# Gauras Mart — Next.js + Tailwind (full rebuild)

Complete reimplementation of the app using Next.js (App Router) + Tailwind.
Reuses your existing Supabase database — no DB changes needed.

## Run locally
1. `cp .env.example .env.local` and fill DATABASE_URL + JWT secrets
   (use the SAME Supabase DB + same `migration.sql` you already ran).
2. `npm install`
3. `npm run dev`  → http://localhost:3000

Login (seeded): admin `9000000001` / `Test@123` (all users `Test@123`).

## Deploy free
Push to GitHub → import on **Vercel** → add the same env vars. Done.

## Feature parity (all built)
- Auth: register (role chooser + per-role forms) / login / refresh / logout / me
- Role dashboards: farmer, manufacturer, distributor, admin (admin = live approvals)
- Settings: manufacturer (capacity + territory), distributor (blocks + partners), farmer (profile + location)
- Products + per-distributor pricing (manufacturer); available products (distributor)
- Master Catalog with fuzzy search (admin manage, manufacturer request)
- Ordering: farmer → distributor aggregation → manufacturer, with allocations
- Payments + order status flow (cascades to farmer allocations)
- Shared sidebar (role-based), theme toggle, language switcher — built ONCE

## Why this is cleaner than the plain-JS version
- `components/AppShell.jsx` renders sidebar + topbar for EVERY page automatically.
- `components/Providers.jsx` = theme + language + toasts, app-wide.
- Pages are tiny: `<AppShell role="farmer"> ...content... </AppShell>`.
- No service-worker cache fights; Next handles assets + code-splitting.

## Structure
- `app/` — pages + API routes (App Router)
- `components/` — AppShell, Topbar, Providers, Toast, Metric
- `lib/` — db, auth, api client, i18n, orgs
