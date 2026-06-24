# SuriPay beta — overnight handoff (Phase 1: security hardening)

Work done autonomously while you were asleep. All changes are on `master`,
verified with `next build` + `eslint` (both green). Nothing was deployed and
`main` (your Vite app) was not touched.

## ✅ What I built (code is in the repo, ready)

1. **`db/005_security_hardening.sql`** — a new migration:
   - Revokes direct `EXECUTE` on `transfer_money` from `anon`/`authenticated`;
     grants it only to `service_role`. → the client can no longer bypass the
     server-side PIN check by calling the RPC directly.
   - Hardens `transfer_money`: `SET search_path`, self-transfer guard,
     amount-check before balance-check, deterministic lock order (deadlock
     prevention). Tier checks from `db/003` preserved.
   - Adds `failed_pin_attempts` + `pin_locked_until` columns to `wallets`.

2. **Server-side PIN** — new `POST /api/pin/set` (service-role) hashes the PIN
   on the server and verifies the current PIN there. `/pin` now calls it;
   **client-side bcrypt is gone** from the PIN flow.

3. **Hardened `POST /api/transfers/send`**:
   - Per-user rate limit (8/min).
   - Self-transfer guard.
   - **PIN brute-force lockout** — 5 wrong PINs → 15-min lock (best-effort;
     activates once `db/005` is applied; safe no-op before that).
   - Stricter input validation.

4. **`src/lib/rateLimit.ts`** — simple in-memory limiter (see caveat below).

## ⚠️ ACTION REQUIRED FROM YOU (can't do these without your accounts)

1. **Apply `db/005_security_hardening.sql`** in the Supabase SQL editor.
   Until you do: the PIN lockout is a no-op and `transfer_money` is still
   client-callable. Everything keeps working either way (changes are
   backward-compatible), but the security benefit only lands after you run it.
2. After applying, **smoke-test on a real device**: set a PIN (now via the
   server route), send money, and try a wrong PIN 5× to confirm the lock.

## 🟡 Deliberately NOT done (needs your review / can't verify unattended)

- **Cookie/SSR auth + Next middleware guard.** The app uses `supabase-js`
  with localStorage tokens; a real server-side middleware guard needs a
  migration to `@supabase/ssr` (cookie sessions). That's invasive and I
  can't runtime-test it without a login, so I left it for a supervised
  session. Current guard stays client-side (fine for beta, not ideal).
- **Real rate limiting.** `rateLimit.ts` is in-memory = per-instance; weak on
  serverless. Swap for Upstash/Redis or a Postgres table before production.
- Prod Supabase project, Vercel deploy, SMTP — all need your accounts.

## Where this leaves the beta plan

Phase 1 (security) is ~70% done in code. Remaining Phase 1: SSR/middleware
auth (supervised). Next up per the plan: **Phase 2 — real admin-mediated
top-up / cash-out**, then deploy + test.

— Left for you to review in the morning. Nothing is irreversible; revert any
commit on `master` if you disagree.
