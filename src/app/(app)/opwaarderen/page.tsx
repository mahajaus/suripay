"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Opt, Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";
import { SP_AGENTS, SP_VOUCHERS, SURIBET, SCRATCH, BANKS } from "@/lib/demo";

export default function OpwaarderenPage() {
  const { setBalance, addTx, noti } = useDemo();
  const [sub, setSub] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState("");
  const [amt, setAmt] = useState("");
  const [sc, setSc] = useState(["", "", "", ""]);
  const [bank, setBank] = useState<(typeof BANKS)[number] | null>(null);
  const [last, setLast] = useState(0);

  const reset = () => {
    setSub(null);
    setStep(0);
    setOk(false);
    setCode("");
    setAmt("");
    setSc(["", "", "", ""]);
    setBank(null);
  };

  const credit = (a: number, ty: string, d: string) => {
    setBalance((b) => b + a);
    addTx(ty, d, a);
    setLast(a);
    setOk(true);
    noti(`${f$(a)} opgewaardeerd!`);
  };

  if (ok)
    return (
      <div>
        <PageTitle>💳 Opwaarderen</PageTitle>
        <Succ
          title="Opgewaardeerd!"
          extra={<div style={{ fontSize: 26, fontWeight: 800 }}>{f$(last)}</div>}
        />
      </div>
    );

  return (
    <div>
      <PageTitle sub="Kies je methode">💳 Opwaarderen</PageTitle>

      {!sub && (
        <Opt
          items={[
            { id: "agent", ic: "🏪", l: "SuriPay Agent", d: "Betaal contant bij een agent", c: "#25D366", onClick: () => setSub("agent") },
            { id: "scratch", ic: "💳", l: "Scratch Kaart", d: "Prepaid kaartcode", c: "#E6B800", onClick: () => setSub("scratch") },
            { id: "bank", ic: "🏦", l: "Bankoverschrijving", d: "Vanaf Surinaamse bank", c: "#3b82f6", onClick: () => setSub("bank") },
            { id: "suribet", ic: "🎰", l: "Suribet Code", d: "Codes van Suribet shops", c: "#FF4500", onClick: () => setSub("suribet") },
          ]}
        />
      )}

      {sub === "agent" && (
        <div>
          <Back onClick={reset} />
          {step === 0 ? (
            <div>
              {SP_AGENTS.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "rgba(255,255,255,.05)", borderRadius: 12, marginBottom: 6 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>🏪</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.n}</div>
                    <div style={{ fontSize: 10, opacity: 0.4 }}>{a.loc} · {a.type}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#25D366" }}>● Open</div>
                </div>
              ))}
              <button onClick={() => setStep(1)} style={{ ...BT("#25D366"), marginTop: 12 }}>Ik heb een code →</button>
            </div>
          ) : (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🏪 Agent-code</div>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SP-0250-7714-RSGK" style={{ ...IS, fontFamily: "monospace", textAlign: "center", marginBottom: 12 }} />
              <button onClick={() => { const v = SP_VOUCHERS[code.trim()]; if (!v) return noti("Ongeldige code", "err"); const ag = SP_AGENTS.find((a) => a.id === v.agent); credit(v.a, "agent", `Agent: ${ag?.n}`); }} style={BT("#25D366")}>Verifiëren</button>
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>Demo: SP-0050-8821-KWTR · SP-0250-7714-RSGK</div>
            </div>
          )}
        </div>
      )}

      {sub === "suribet" && (
        <div>
          <Back onClick={reset} />
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎰 Suribet-code</div>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SB-100-7742-AXKP" style={{ ...IS, fontFamily: "monospace", textAlign: "center", marginBottom: 12 }} />
            <button onClick={() => { const v = SURIBET[code.trim()]; if (!v) return noti("Ongeldige code", "err"); credit(v.a, "suribet", `Suribet ${v.s}`); }} style={BT("#FF4500")}>Verifiëren</button>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>Demo: SB-50-2204-GJKR · SB-250-3318-BRMN</div>
          </div>
        </div>
      )}

      {sub === "scratch" && (
        <div>
          <Back onClick={reset} />
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💳 Scratch-code</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
              {[0, 1, 2, 3].map((i) => (
                <input key={i} maxLength={4} value={sc[i]} placeholder="0000" onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); const n = [...sc]; n[i] = v; setSc(n); }} style={{ width: 60, padding: "12px 4px", textAlign: "center", fontSize: 16, fontWeight: 700, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, color: "#fff", outline: "none" }} />
              ))}
            </div>
            <button onClick={() => { const v = SCRATCH[sc.join("-")]; if (!v) return noti("Ongeldige code", "err"); credit(v.a, "topup", "Scratch Kaart"); }} style={BT("#E6B800", "#0B3D2E")}>Verifiëren</button>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 10 }}>Demo: 4821-7390-5516-2847 (25)</div>
          </div>
        </div>
      )}

      {sub === "bank" && (
        <div>
          <Back onClick={reset} />
          {!bank ? (
            BANKS.map((b) => (
              <button key={b.id} onClick={() => setBank(b)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: b.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{b.ab}</div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{b.n}</span>
              </button>
            ))
          ) : (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{bank.n}</div>
              <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
              <button onClick={() => { const a = parseFloat(amt); if (!a) return; credit(a, "topup", `Bank ${bank.ab}`); }} style={BT("#3b82f6")}>Bevestigen</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
