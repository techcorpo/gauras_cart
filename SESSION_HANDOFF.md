# Gauras Mart — Session Handoff Note

> Paste this into a new Arena session so the assistant knows my setup, preferences, and project context.

---

## 👤 About me / how to talk to me
- I'm **semi-technical**. Explain things in **simple, normal language** — not overly technical.
- When something is ambiguous or missing info, **ask me first** (don't guess on big things).
- Tell me **exactly which files to copy** after changes, and remind me to **test locally** before deploying.

## 💻 My environment
- I work on a **Windows laptop**.
- I edit/run the code in **VS Code**.
- I **test locally** first (`npm run dev` on http://localhost:3000), then push.
- **Deploy:** push to **GitHub** → auto-deploy to **Vercel** (free tier).
- **Database:** **Supabase** (free tier), PostgreSQL.

## 🧱 Tech stack
- **Next.js 14** (App Router) — note: 14.2.5 currently
- **React 18**
- **Tailwind CSS 3**
- **JavaScript / JSX** (NOT TypeScript)
- **`pg`** for raw SQL queries (no ORM)
- **bcryptjs** (password/PIN hashing) + **jsonwebtoken** (JWT auth)
- **lucide-react** for icons
- PWA: service worker + manifest + install button

## 🏪 What the app is
**Gauras Mart** — a B2B2C agri-marketplace with the flow:
**Manufacturer → Distributor → Farmer**
- **Manufacturer:** makes/supplies agricultural inputs to distributors.
- **Distributor:** middleman seller — aggregates farmer orders and buys from manufacturers. (NOT a delivery carrier.)
- **Farmer:** orders seeds/fertilizers/inputs from distributors.
- **Admin:** manages users + product catalog.

## 🎨 Design / UI rules
- Amazon-style "Farmer Hub" look: dark slate header, amber CTA/cart buttons, rounded cards.
- **Brand color is controlled by a runtime color picker** (CSS variables) — respect it; use **amber** for cart/CTA.
- **"Gauras Mart" brand name NEVER translates** (stays English in all languages). Subtitles DO translate.
- Languages supported: English + **Hindi, Marathi, Gujarati** (i18n dictionary in `lib/i18n.js`).

## 🔑 Auth rules
- **Farmers log in with a 4-digit PIN**; everyone else uses a password.
- **6-month sessions** for all roles (JWT TTL = 180 days).
- Login is by **phone number + secret** (PIN or password).

## ⚙️ How to run it (on my laptop)
```bash
cp .env.example .env.local     # then fill DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev                     # http://localhost:3000
```
- Run `db/set-farmer-pins.sql` in Supabase so farmers can log in with PIN **1234**.
- Seeded test login phones: admin 9000000001; manufacturers 9000000002/3; distributors 9000000004/5/6; farmers 9000000007/8/9 (farmers use PIN 1234, others password Test@123).

## 🚫 Things to skip (no database backing yet)
Wallet/payments, reviews/ratings, feed-logs/milk-yield charts, silage calculator, persona-switcher.
(Use **placeholder** product images — emoji + gradient — since there's no image column.)

## 📌 Notes about the assistant's sandbox (so I'm not surprised)
- `node_modules` and `.next` get wiped between runs — assistant must `npm install` before building/testing.
- Assistant **cannot click-test against my real Supabase** — I must verify flows locally.
- Each Arena session is isolated; the assistant can't see my other sessions.

---

### Where the project lives
Project root folder: **`gauras-next/`** (the only active project). A zip of it is `gauras-next.zip` — unzip into the new workspace to continue.
