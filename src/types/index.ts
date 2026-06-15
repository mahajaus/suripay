// Gedeelde datamodellen voor SuriPay.
// Velden volgen het Supabase-schema; numeric/date/timestamptz komen als string
// of number terug via de supabase-js client.

/** Naam van een KYC-tier; verwijst naar kyc_tiers.name. */
export type KycTierName = "normal" | "medium" | "high";

/** Eén configureerbare KYC-tier uit de tabel public.kyc_tiers. */
export interface KycTier {
  id: string;
  name: KycTierName;
  display_name: string;
  /** Maximaal saldo in SRD. */
  max_balance: number;
  /** Maximaal te ontvangen per kalenderjaar in SRD. */
  annual_receive_limit: number;
  /** Wat er nodig is, bijv. 'phone', 'phone_email_id', 'phone_email_id_passport'. */
  required_kyc: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Een wallet uit de tabel public.wallets. */
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pin_hash: string | null;
  /** Huidige KYC-tier; verwijst naar kyc_tiers.name. */
  tier: KycTierName;
  /** Teller voor het ontvangen bedrag dit kalenderjaar (SRD). */
  received_this_year: number;
  /** Datum waarop de jaarteller voor het laatst is gereset (ISO 'YYYY-MM-DD'). */
  year_reset_at: string | null;
}
