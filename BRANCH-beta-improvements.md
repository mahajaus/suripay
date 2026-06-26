# Branch `beta-improvements` — autonoom werk (NIET gemerged)

Gemaakt terwijl je weg was. **Niet naar `master` gepusht** zodat de live app
stabiel bleef — deze branch is een Vercel **preview** (eigen URL, raakt
productie niet). Build + lint groen.

## Wat erin zit

### 1. Beveiligingsfix — SRD kan niet meer uitgeschakeld worden
Een admin kon via `/admin/koersen` de basisvaluta **SRD** op "niet actief"
zetten → dat zou élke wissel/overboeking breken (de RPC's vereisen `enabled`).
- `src/app/api/admin/rates/route.ts`: `enabled` wordt genegeerd voor SRD.
- `src/app/admin/koersen/page.tsx`: SRD-checkbox uitgeschakeld.
- **Code-only, geen migratie.**

### 2. KYC afwijzen mét reden
- `db/016_kyc_reject_reason.sql` — kolom `reject_reason` op `kyc_submissions`. **Toepassen bij merge.**
- `/api/kyc/review`: slaat reden op bij afwijzen.
- `/admin/kyc`: vraagt om een reden (prompt) bij Afwijzen.
- `/kyc`: toont de laatste inzending-status — **afgewezen + reden** (rood blok)
  of **in behandeling** (geel) — en laat opnieuw proberen toe.

### 3. Echte README
`README.md` vervangt de create-next-app boilerplate (stack, structuur,
migraties, env, BETA-flag, koersmodel, deploy-pointers).

## Audit van de geld-code (blind geschreven RPC's)
Zorgvuldig nagelezen: `transfer_money_fx`, `exchange_currency`,
`admin_credit/debit_wallet`, de send-route. **Overall solide:** locking is
deadlock-veilig (FOR UPDATE op beide wallets in id-volgorde), deling door nul
afgevangen (`v_to_rate <= 0`), bedragen zijn exacte `numeric`, buy/sell-richting
klopt (buy aan bron, sell aan doel).
- **Eén klein punt (genoteerd, niet gefixt):** een opname-**refund** (bij
  afwijzen) loopt door `admin_credit_wallet` die de tier-`max_balance` checkt.
  In de praktijk kan dit geen geld stranden (een refund herstelt de vorige
  stand ≤ max), maar conceptueel hoort een terugboeking geen limietcheck te
  hebben. Te fixen met een `p_skip_limit`-parameter wanneer gewenst.

## BEWUST NIET gebouwd (samen doen, getest)
**Per-valuta bedragen in de historie.** Nu toont een EUR-overboeking bij beide
partijen de SRD-tegenwaarde; ideaal is verzender −€10 / ontvanger +SRD 384,60.
Dit raakt **alle** geld-loggende RPC's (`transfer_money`, `transfer_money_fx`,
`admin_credit/debit_wallet`) én `get_my_transactions` (return-vorm). Te riskant
om blind op een live geld-app te bouwen.
**Klaar plan:** voeg `from_currency/to_currency/from_amount/to_amount` toe aan
`transactions`; vul ze in elke insert; laat `get_my_transactions` per
kijker-zijde het juiste bedrag+valuta teruggeven; client toont
`{teken}{symbool} {bedrag}`. ~1 migratie + clientwijziging, samen testen.

## Mergen wanneer je terug bent
1. Bekijk de **preview-deployment** in Vercel (branch `beta-improvements`).
2. `git checkout master && git merge beta-improvements && git push`
   → dit triggert een **productie-deploy**.
3. **Pas `db/016` toe** in de Supabase SQL-editor.
4. Test KYC-afwijzen + de SRD-lock op productie.
