# SuriPay — Deploy runbook (closed beta)

Status: build is deploy-ready (`next build` groen, 42 routes). Hosting =
**Vercel** (auto-detect Next.js 16; geen `vercel.json` nodig). Dit is de
Next.js-app op branch **`master`** — NIET de Vite-app op `main`.

---

## 1. Environment variables (zet deze in Vercel → Project → Settings → Env Vars)

| Variabele | Scope | Waarde |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | Supabase project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | service_role secret — NOOIT met `NEXT_PUBLIC_` prefix |
| `KYC_ADMIN_EMAILS` | server only | komma-lijst admin-e-mails (default = mahajaus@gmail.com) |

Zet ze voor **Production** (en evt. Preview). `.env.local` wordt niet
gedeployed — die staat lokaal en is gitignored.

---

## 2. Supabase voor productie — KEUZE (jouw beslissing)

⚠️ Belangrijk: de db/*.sql-bestanden bevatten alleen ONZE migraties
(001–014). De **basis-tabellen + functies** (wallets, transactions, kyc_tiers,
oorspronkelijke RPC's) komen uit de originele app en zitten alléén in je
bestaande Supabase-project.

- **Optie A — Hergebruik je bestaande Supabase-project (aanbevolen voor closed beta).**
  Wijst Vercel gewoon naar je huidige project. Volledige werkende schema staat
  er al. Nadeel: testdata zit ertussen (kun je opschonen).

- **Optie B — Vers prod-project.** Dan moet je het volledige schema
  reproduceren. db/000 (reconstructie) is nooit geverifieerd, dus betrouwbaarder
  is een `pg_dump --schema-only` van je huidige project → restore in het nieuwe,
  daarna data leeg laten. Migratie-volgorde indien handmatig: 001 → 014.

**Migratievolgorde (referentie):** 001 kyc_tiers · 002 rls · 003 transfer tier ·
004 kyc_submissions · 005 security · 006 topup/withdraw · 007 currencies ·
008 wallet-trigger · 009 find_wallet · 010 tx-type · 011 fx · 012 fx-target ·
013 get_my_tx · 014 get_my_tx-single.

---

## 3. Supabase Auth-config (Dashboard → Authentication)

- **URL Configuration → Site URL:** je Vercel-URL (bv. `https://suripay.vercel.app`).
- **Redirect URLs:** voeg dezelfde URL toe (voor bevestigings-/reset-links).
- **Email:** standaard mailer levert slecht af → zet **eigen SMTP** in
  (Authentication → Emails → SMTP), of houd "Confirm email" uit tijdens beta.
- **Storage:** bucket `kyc` bestaat al (db/004); blijft privé.

---

## 4. Deploy-stappen (Vercel)

1. Vercel → New Project → importeer GitHub-repo **mahajaus/suripay**.
2. **Branch:** `master` (Production Branch instellen op `master`!).
3. Framework preset: Next.js (auto). Build command/Output: standaard laten.
4. Zet de env-vars uit stap 1.
5. Deploy. Daarna stap 3 (Site URL/redirects) bijwerken met de echte URL.

---

## 5. Post-deploy smoke test (op de live URL)

Login → PIN → opwaarderen→admin crediteren → versturen (SRD + EUR) →
wisselen → opnemen→admin betalen → KYC → historie. (Zie smoke-test in
BETA-HANDOFF.md.)

---

## 6. Pre-productie checklist (vóór écht geld / open beta)

- [ ] **SSR/cookie-auth + middleware** (nu client-side guard; `@supabase/ssr`).
- [ ] **Rate limiting** naar gedeelde store (Upstash/Redis of Postgres) —
      `src/lib/rateLimit.ts` is nu in-memory en zwak op serverless.
- [ ] **Echte FX-koersen** (nu demo: 1 EUR = 38,46 SRD in `currencies`).
- [ ] **Echte SMTP** + e-mailbevestiging aan.
- [ ] **Echte IDV-provider** voor KYC (nu admin-review op selfie+ID).
- [ ] **Error monitoring** (Sentry) + logging.
- [ ] **Juridisch:** voorwaarden, privacy, biometrische toestemming; check
      e-money/AML-vereisten in Suriname vóór echt geld.
- [ ] Demo-flows: blijven verborgen via `BETA=true` tot ze een echte backend
      hebben (`src/lib/beta.ts`).
