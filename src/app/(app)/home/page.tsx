"use client";

import { useRouter } from "next/navigation";
import { f$, fD, SP } from "@/lib/ui";
import { RATES, GOLD_USD_PER_GRAM, TXI } from "@/lib/demo";
import { BETA } from "@/lib/beta";
import { useDemo } from "../_components/DemoProvider";

// Geldechte tegels die in beta zichtbaar blijven.
const BETA_TILES = ["/opwaarderen", "/versturen", "/qr", "/opnemen", "/wisselen"];

// 4×4 actie-rooster — elke tegel naar een echt scherm.
const ACTIONS: { ic: string; l: string; c: string; href: string }[] = [
  { ic: "💳", l: "Opwaarderen", c: "#25D366", href: "/opwaarderen" },
  { ic: "↑", l: "Versturen", c: "#25D366", href: "/versturen" },
  { ic: "📩", l: "Aanvragen", c: "#E6B800", href: "/aanvragen" },
  { ic: "📱", l: "QR", c: "#E6B800", href: "/qr" },
  { ic: "🧾", l: "Rekeningen", c: "#3b82f6", href: "/rekeningen" },
  { ic: "🏧", l: "Opnemen", c: "#a855f7", href: "/opnemen" },
  { ic: "🥇", l: "CBvS Goud", c: "#E6B800", href: "/goud" },
  { ic: "🪙", l: "Crypto", c: "#F7931A", href: "/crypto" },
  { ic: "🐷", l: "Sparen", c: "#10B981", href: "/sparen" },
  { ic: "🏦", l: "Leningen", c: "#0066B3", href: "/leningen" },
  { ic: "🛡️", l: "Verzekering", c: "#E11D48", href: "/verzekering" },
  { ic: "🎁", l: "Cashback", c: "#F59E0B", href: "/cashback" },
  { ic: "🛒", l: "Marktplaats", c: "#a855f7", href: "/markt" },
  { ic: "🏛️", l: "Overheid", c: "#1B3A5C", href: "/overheid" },
  { ic: "🌍", l: "Diaspora", c: "#3b82f6", href: "/diaspora" },
  { ic: "🌾", l: "Landbouw", c: "#10B981", href: "/landbouw" },
  { ic: "💱", l: "Wisselen", c: "#E6B800", href: "/wisselen" },
];

export default function HomePage() {
  const router = useRouter();
  const { balance, savings, cashback, goldGrams, txs, currencies, fx } = useDemo();
  const foreign = currencies.filter((c) => c.code !== "SRD");
  const curSym = (code?: string) =>
    currencies.find((c) => c.code === code)?.symbol ?? code ?? "SRD";
  const fmtAmt = (n: number) =>
    Math.abs(n).toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const goldValueSRD = goldGrams * (GOLD_USD_PER_GRAM / RATES.USD);

  return (
    <div>
      {/* SALDO-KAART */}
      <div
        style={{
          background:
            "linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04))",
          borderRadius: 20,
          padding: 20,
          marginTop: 12,
          border: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.4 }}>BESCHIKBAAR SALDO</span>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>SRD </span>
          {balance.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 6,
            fontSize: 10,
            opacity: 0.4,
            flexWrap: "wrap",
          }}
        >
          <span>≈ USD {(balance * RATES.USD).toFixed(2)}</span>
          {!BETA && (
            <>
              <span>🐷 {f$(savings)}</span>
              <span>🥇 {goldGrams.toFixed(2)}g</span>
              <span>🎁 {f$(cashback)}</span>
            </>
          )}
        </div>
      </div>

      {/* MIJN VALUTA */}
      {foreign.length > 0 && (
        <div
          onClick={() => router.push("/wisselen")}
          style={{
            cursor: "pointer",
            background: "rgba(255,255,255,.05)",
            borderRadius: 14,
            padding: "14px 16px",
            marginTop: 10,
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Mijn valuta</span>
            <span style={{ fontSize: 11, color: SP.gold, fontWeight: 600 }}>Wisselen →</span>
          </div>
          {foreign.map((c) => {
            const bal = fx[c.code] ?? 0;
            return (
              <div key={c.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {c.symbol} {c.code}
                </span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {c.symbol} {bal.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.4 }}>≈ {f$(bal * c.buy_srd)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GOUD-KAART (verborgen in beta) */}
      {!BETA && (
      <div
        onClick={() => router.push("/goud")}
        style={{
          cursor: "pointer",
          background:
            "linear-gradient(135deg,rgba(230,184,0,.15),rgba(230,184,0,.04))",
          borderRadius: 14,
          padding: "14px 18px",
          marginTop: 10,
          border: "1px solid rgba(230,184,0,.2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🥇</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SP.gold }}>
            CBvS Digitaal Goud
          </div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>
            {goldGrams.toFixed(2)} gram · Centrale Bank van Suriname
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: SP.gold }}>
            {f$(goldValueSRD)}
          </div>
          <div style={{ fontSize: 9, opacity: 0.4 }}>5% rente/jaar</div>
        </div>
      </div>
      )}

      {/* ACTIE-ROOSTER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 8,
          marginTop: 14,
        }}
      >
        {(BETA ? ACTIONS.filter((a) => BETA_TILES.includes(a.href)) : ACTIONS).map((a) => (
          <button
            key={a.l}
            onClick={() => router.push(a.href)}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 14,
              padding: "12px 4px",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 18 }}>{a.ic}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: a.c,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {a.l}
            </span>
          </button>
        ))}
      </div>

      {/* RECENTE TRANSACTIES */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Recente transacties
          </span>
          <button
            onClick={() => router.push("/historie")}
            style={{
              background: "none",
              border: "none",
              color: SP.gold,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Alles →
          </button>
        </div>

        {txs.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "28px 0", opacity: 0.4, fontSize: 13 }}
          >
            Nog geen transacties
          </div>
        ) : (
          txs.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background:
                      tx.a > 0 ? "rgba(37,211,102,.12)" : "rgba(231,76,60,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  {TXI[tx.ty] || "•"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {tx.other ? `${tx.a > 0 ? "Van " : "Naar "}${tx.other}` : tx.d}
                  </div>
                  {tx.other && tx.d && (
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{tx.d}</div>
                  )}
                  <div style={{ fontSize: 10, opacity: 0.3 }}>{fD(tx.dt)}</div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tx.a > 0 ? SP.green : SP.red,
                }}
              >
                {tx.a > 0 ? "+" : ""}
                {curSym(tx.cur)} {fmtAmt(tx.a)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
