// Admin-allowlist voor KYC-beoordeling.
// De server is gezaghebbend (voegt KYC_ADMIN_EMAILS uit de omgeving toe);
// de client gebruikt alleen de default-lijst om een menu-item te tonen.
export const DEFAULT_ADMIN_EMAILS = ["mahajaus@gmail.com"];

export function adminEmails(): string[] {
  const env = process.env.KYC_ADMIN_EMAILS;
  const extra = env
    ? env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  return Array.from(
    new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...extra])
  );
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
