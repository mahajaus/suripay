# SuriPay beta — handoff

Autonomous progress on the closed-beta plan. All changes on `master`,
verified with `next build` + `eslint` (green). Nothing deployed; `main`
(your Vite app) untouched.

## ⚠️ ACTION REQUIRED FROM YOU (Supabase SQL editor)

Run these migrations in order if not yet applied:
1. `db/005_security_hardening.sql` — **applied ✅**
2. `db/006_topup_withdraw.sql` — **applied ✅**
3. `db/007_currencies.sql` — **NOT yet applied.** Adds multi-currency wallet:
   `currencies` (SRD/EUR/USD enabled; BRL/CNY/GYD seeded but disabled) +
   `wallet_balances` (foreign balances) + `exchange_currency` RPC.

The app keeps working before you apply `db/007` (the currency card just stays
empty and `/wisselen` shows "laden…"), but exchange won't function until the
tables/functions exist.

---

## Phase 1 — Security hardening ✅ (live, db/005 applied)
- `transfer_money` is service-role only (PIN check can't be bypassed).
- PIN hashing/verification fully server-side (`/api/pin/set`).
- PIN brute-force lockout (5 wrong → 15 min), rate limiting, self-transfer guard.

## Phase 2 — Real admin-mediated top-up & cash-out ✅ (code done; needs db/006)
Closed-beta model — no external payment integration:
- **Top-up:** user submits a request (`/opwaarderen` → `/api/topup/request`,
  status `pending`). Admin approves → `admin_credit_wallet` credits the real
  balance. Bank instructions shown to the user.
- **Cash-out:** user submits a request (`/opnemen` → `/api/withdrawals/request`).
  Amount is **reserved (debited) immediately** so it can't be double-spent.
  Admin marks paid, or rejects → automatic refund.
- **Admin:** `/admin` hub → `/admin/topups` + `/admin/withdrawals` (and the
  existing `/admin/kyc`). All gated by the email allowlist (`src/lib/admin.ts`,
  defaults to your account). Balance mutations only via service-role RPCs
  (`admin_credit_wallet` / `admin_debit_wallet`).
- **Security fix:** dropped client write access to `wallets` (db/006).

Verified: endpoint auth gates return 403 (admin) / 401 (user) without a token;
`/admin` shows "Geen toegang" when logged out.

## 🧪 Smoke test when you're back (needs a real login)
1. Apply `db/006`.
2. As a user: `/opwaarderen` → submit a request. As admin: `/admin/topups` →
   approve → your balance goes up (reload home to see it).
3. As a user: `/opnemen` → request (balance drops immediately). As admin:
   `/admin/withdrawals` → mark paid, or reject (balance comes back).
4. KYC + send/PIN-lockout from Phase 1.

## 🟡 Still pending (per the plan)
- **Phase 1 leftover:** server-side middleware auth (needs `@supabase/ssr`
  cookie migration; invasive — left for a supervised session).
- **Phase 3:** hide the still-demo flows (gold, crypto, savings, etc.) for beta.
- **Phase 5/6:** prod Supabase, Vercel deploy, SMTP, testing — need your accounts.
- Replace in-memory `rateLimit.ts` with a shared store before production.

— Review the commits on `master`; revert anything you disagree with.
