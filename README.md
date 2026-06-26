# SuriPay

Suriname's digitale wallet — een mobiel-first betaal-app (SRD + EUR + USD,
uitbreidbaar) met peer-to-peer overboekingen, QR, opwaarderen/opnemen,
multi-valuta wisselen, cross-currency remittance en KYC.

> **Let op — twee codebases in deze repo:** branch **`master`** = deze
> **Next.js**-app (live op Vercel). Branch **`main`** = een oudere **Vite**-app.
> Niet door elkaar halen; `main` niet overschrijven.

Status: **closed beta, live** op https://suripay.vercel.app

## Stack
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** (Postgres, Auth, RLS, Storage, RPC's)
- Inline-styled donkergroen/goud thema (mockup-getrouw), Nederlands, SRD

## Projectstructuur
```
src/app/
  (auth)/        login, register            ← buiten de app-shell
  (app)/         home, versturen, qr, opwaarderen, opnemen, wisselen,
                 kyc, pin, profiel, historie + demo-schermen
                 _components/  DemoProvider (sessie-store), kit, ComingSoon
  admin/         hub + kyc, topups, withdrawals, koersen   ← admin-only
  api/           transfers/send, exchange, pin/set, topup/request,
                 withdrawals/request, kyc/review, admin/*
src/lib/         supabase, ui (tokens/formatters), demo (mockup-data),
                 beta (feature-flag), admin, serverAdmin, rateLimit
db/              001-015  geordende SQL-migraties
```

## Database
Pas de migraties in volgorde toe in de Supabase SQL-editor: **`db/001` ... `db/015`**.
Kerntabellen: `wallets`, `transactions`, `kyc_tiers`, `kyc_submissions`,
`topup_requests`, `withdrawals`, `currencies`, `wallet_balances`.
Geld muteert uitsluitend via SECURITY DEFINER-RPC's die alleen de service-role
mag aanroepen (`transfer_money`, `transfer_money_fx`, `exchange_currency`,
`admin_credit_wallet`, `admin_debit_wallet`).

## Environment (`.env.local`, en in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only, nooit NEXT_PUBLIC_
KYC_ADMIN_EMAILS=admin@example.com # komma-lijst; default in src/lib/admin.ts
```

## Lokaal draaien
```
npm install
npm run dev      # http://localhost:3000
npm run build    # productie-build
npm run lint
```

## Beta feature-flag
`src/lib/beta.ts` -> `BETA`. In beta zijn de nog-niet-echte (demo) schermen
verborgen (goud, crypto, sparen, marktplaats, enz.) zodat testers alleen
geldechte flows zien. Zet `BETA = false` voor de volledige mockup-vision.

## Koersen (CME-model)
`currencies` heeft `buy_srd` / `sell_srd` per valuta (cambio-spread = marge).
Operator zet de dagkoersen in **`/admin -> Wisselkoersen`** (bron: CME,
www.cme.sr). SRD is de basis (vast op 1).

## Verder lezen
- `DEPLOY.md` — Vercel + Supabase deploy-runbook
- `BETA-HANDOFF.md` — status, fixes en pre-productie checklist
