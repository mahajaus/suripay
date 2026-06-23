// Gedeelde stijl-tokens en formatters voor de SuriPay app-shell.
// De vormgeving volgt de mockup: donkergroene gradient + goud accent.
import type { CSSProperties } from "react";

/** Kleurenpalet van de app-shell. */
export const SP = {
  bgFrom: "#0B3D2E",
  bgMid: "#0D4A35",
  bgTo: "#0F5A40",
  ink: "#0B3D2E",
  gold: "#E6B800",
  green: "#25D366",
  red: "#e74c3c",
} as const;

/** Achtergrond-gradient van elke app-pagina. */
export const APP_BG = `linear-gradient(165deg,${SP.bgFrom},${SP.bgMid},${SP.bgTo})`;

/** SRD-bedrag, Nederlandse notatie, altijd 2 decimalen (absolute waarde). */
export const f$ = (n: number) =>
  `SRD ${Math.abs(n).toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Korte datum + tijd, bijv. "23 jun 14:05". */
export const fD = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Standaard invoerveld. */
export const IS: CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

/** Knop-stijl met opvulkleur. */
export const BT = (bg: string, c = "#fff"): CSSProperties => ({
  width: "100%",
  padding: "15px",
  borderRadius: 12,
  background: bg,
  border: "none",
  color: c,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
});
