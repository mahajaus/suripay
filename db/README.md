# Database (Supabase)

Versiebeheerde SQL voor het SuriPay-schema. De bestanden zijn idempotent —
veilig om opnieuw uit te voeren. Draai ze in numerieke volgorde in de
Supabase SQL Editor:

| Bestand | Wat het doet |
| --- | --- |
| `001_kyc_tiers.sql` | Tabel `kyc_tiers`, `updated_at`-trigger, drie start-tiers, en de extra `wallets`-kolommen (`tier`, `received_this_year`, `year_reset_at`). |
| `002_kyc_tiers_rls.sql` | RLS op `kyc_tiers`: ingelogde gebruikers mogen lezen, niemand mag via de client wijzigen. |

Voer `001` vóór `002` uit.
