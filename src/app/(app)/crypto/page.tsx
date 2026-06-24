"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";
import { COINS } from "@/lib/demo";

export default function CryptoPage() {
  const { balance, setBalance, cryptoB, setCrypto, addTx, noti } = useDemo();
  const [coin, setCoin] = useState<(typeof COINS)[number]>(COINS[0]);
  const [mode, setMode] = useState<"buy" | "sell" | null>(null);
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);

  const total = COINS.reduce((s, c) => s + (cryptoB[c.id] || 0) * c.r, 0);

  if (ok)
    return (
      <div>
        <PageTitle>🪙 Crypto</PageTitle>
        <Succ title="Crypto gelukt!" />
      </div>
    );

  return (
    <div>
      <PageTitle>🪙 Crypto</PageTitle>

      <div style={{ background: "rgba(247,147,26,.08)", borderRadius: 14, padding: 16, border: "1px solid rgba(247,147,26,.12)", textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>CRYPTO PORTFOLIO</div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{f$(total)}</div>
      </div>

      {COINS.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>{c.ic}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{c.sy}</div><div style={{ fontSize: 10, opacity: 0.4 }}>{c.net}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{(cryptoB[c.id] || 0).toFixed(2)}</div><div style={{ fontSize: 10, opacity: 0.4 }}>{f$((cryptoB[c.id] || 0) * c.r)}</div></div>
        </div>
      ))}

      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Kopen / Verkopen</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {COINS.map((c) => (
            <button key={c.id} onClick={() => setCoin(c)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: coin.id === c.id ? `${c.c}20` : "rgba(255,255,255,.04)", border: coin.id === c.id ? `2px solid ${c.c}` : "1px solid rgba(255,255,255,.08)", cursor: "pointer", color: "#fff" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: c.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{c.ic}</div>
              <span style={{ fontSize: 9 }}>{c.sy}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {(["buy", "sell"] as const).map((t) => (
            <button key={t} onClick={() => setMode(t)} style={{ flex: 1, padding: 10, borderRadius: 8, fontWeight: 600, cursor: "pointer", background: mode === t ? "rgba(247,147,26,.2)" : "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#fff" }}>{t === "buy" ? "Kopen" : "Verkopen"}</button>
          ))}
        </div>
        {mode && (
          <div>
            <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={`Bedrag (${coin.sy})`} style={{ ...IS, marginBottom: 12 }} />
            <button
              onClick={() => {
                const a = parseFloat(amt);
                if (!a) return;
                const srd = a * coin.r;
                if (mode === "buy") {
                  if (srd > balance) return noti("Onvoldoende saldo", "err");
                  setBalance((b) => b - srd);
                  setCrypto((p) => ({ ...p, [coin.id]: (p[coin.id] || 0) + a }));
                  addTx("crypto", `Koop ${coin.sy}`, -srd);
                } else {
                  if (a > (cryptoB[coin.id] || 0)) return noti("Onvoldoende", "err");
                  setBalance((b) => b + srd);
                  setCrypto((p) => ({ ...p, [coin.id]: p[coin.id] - a }));
                  addTx("crypto", `Verkoop ${coin.sy}`, srd);
                }
                setOk(true);
                noti("Gelukt!");
              }}
              style={BT("#F7931A")}
            >
              {mode === "buy" ? "Kopen" : "Verkopen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
