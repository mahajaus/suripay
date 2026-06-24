"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$, SP } from "@/lib/ui";
import { RATES, GOLD_USD_PER_GRAM } from "@/lib/demo";

export default function GoudPage() {
  const { balance, setBalance, goldGrams, setGold, addTx, noti } = useDemo();
  const [mode, setMode] = useState<"buy" | "sell" | null>(null);
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);

  const priceSRD = GOLD_USD_PER_GRAM / RATES.USD;
  const valueSRD = goldGrams * priceSRD;
  const g = parseFloat(amt);

  if (ok)
    return (
      <div>
        <PageTitle>🥇 CBvS Digitaal Goud</PageTitle>
        <Succ title={mode === "buy" ? "Goud gekocht!" : "Goud verkocht!"} extra={<div style={{ fontSize: 22, fontWeight: 800 }}>{(g || 0).toFixed(2)} gram</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle sub="Gedekt door de Centrale Bank van Suriname">🥇 CBvS Digitaal Goud</PageTitle>

      <div style={{ background: "linear-gradient(135deg,rgba(230,184,0,.15),rgba(184,134,11,.06))", borderRadius: 18, padding: 20, border: "1px solid rgba(230,184,0,.2)", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.5 }}>UW GOUDBEZIT</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: SP.gold, marginTop: 4 }}>{goldGrams.toFixed(2)} <span style={{ fontSize: 14 }}>gram</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: 0.5 }}>WAARDE</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{f$(valueSRD)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(230,184,0,.15)" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 9, opacity: 0.4 }}>GOUDPRIJS/GRAM</div><div style={{ fontSize: 12, fontWeight: 700 }}>SRD {priceSRD.toFixed(0)}</div></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 9, opacity: 0.4 }}>CBvS RENTE</div><div style={{ fontSize: 12, fontWeight: 700, color: SP.green }}>5%/jaar</div></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setMode("buy")} style={{ flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer", background: mode === "buy" ? "rgba(230,184,0,.2)" : "rgba(255,255,255,.05)", border: "1px solid rgba(230,184,0,.2)", color: mode === "buy" ? SP.gold : "rgba(255,255,255,.5)" }}>Kopen</button>
        <button onClick={() => setMode("sell")} style={{ flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer", background: mode === "sell" ? "rgba(231,76,60,.2)" : "rgba(255,255,255,.05)", border: "1px solid rgba(231,76,60,.2)", color: mode === "sell" ? SP.red : "rgba(255,255,255,.5)" }}>Verkopen</button>
      </div>

      {mode && (
        <div style={card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[0.5, 1, 2, 5].map((q) => (
              <button key={q} onClick={() => setAmt(String(q))} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", background: amt === String(q) ? "rgba(230,184,0,.2)" : "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#fff" }}>{q}g</button>
            ))}
          </div>
          <input type="number" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Gram" style={{ ...IS, marginBottom: 10 }} />
          {!!g && (
            <div style={{ background: "rgba(230,184,0,.08)", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.5 }}>Totaal (incl. 1,5% fee)</span><b style={{ color: SP.gold }}>{f$(g * priceSRD * (mode === "buy" ? 1.015 : 0.985))}</b></div>
            </div>
          )}
          <button
            onClick={() => {
              if (!g) return;
              if (mode === "buy") {
                const cost = g * priceSRD * 1.015;
                if (cost > balance) return noti("Onvoldoende saldo", "err");
                setBalance((b) => b - cost);
                setGold((p) => p + g);
                addTx("gold", `Goud ${g.toFixed(2)}g`, -cost);
              } else {
                if (g > goldGrams) return noti("Onvoldoende goud", "err");
                const earn = g * priceSRD * 0.985;
                setBalance((b) => b + earn);
                setGold((p) => p - g);
                addTx("gold", `Goud verkoop ${g.toFixed(2)}g`, earn);
              }
              setOk(true);
              noti("Gelukt!");
            }}
            style={BT(SP.gold, SP.ink)}
          >
            {mode === "buy" ? "Goud kopen" : "Goud verkopen"}
          </button>
        </div>
      )}
    </div>
  );
}
