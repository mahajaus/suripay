// Eenvoudige in-memory rate limiter (best-effort).
// LET OP: per server-instance. Op serverless (meerdere instances) is dit
// zwak — vervang vóór productie door een gedeelde store (Upstash/Redis of
// een Postgres-tabel). Voor een single-instance closed beta volstaat het.

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

/**
 * Geeft true als de aanroep is toegestaan, false als het limiet is bereikt.
 * @param key     unieke sleutel (bv. `transfer:<userId>`)
 * @param max     maximaal aantal hits binnen het venster
 * @param windowMs venstergrootte in ms
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now > hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (hit.count >= max) return false;
  hit.count += 1;
  return true;
}
