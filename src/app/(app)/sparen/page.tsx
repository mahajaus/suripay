"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle } from "../_components/kit";
import { IS, BT, f$, SP } from "@/lib/ui";

export default function SparenPage() {
  const { balance, setBalance, savings, setSavings, addTx, noti } = useDemo();
  const [mode, setMode] = useState<"in" | "out" | null>(null);
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);

  if (ok)
    return (
      <div>
        <PageTitle>🐷 Spaarpot</PageTitle>
        <Succ title="Gelukt!" />
      </div>
    );

  return (
    <div>
      <PageTitle>🐷 Spaarpot</PageTitle>

      <div style={{ background: "rgba(16,185,129,.1)", borderRadius: 16, padding: 20, border: "1px solid rgba(16,185,129,.15)", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>SPAARSALDO</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#10B981", marginTop: 4 }}>{f$(savings)}</div>
        <div style={{ fontSize: 11, opacity: 0.4 }}>3,5% rente/jaar</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["in", "out"] as const).map((d) => (
          <button key={d} onClick={() => setMode(d)} style={{ flex: 1, padding: 12, borderRadius: 10, fontWeight: 600, cursor: "pointer", background: mode === d ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#fff" }}>{d === "in" ? "💰 Inleggen" : "💸 Opnemen"}</button>
        ))}
      </div>

      {mode && (
        <div>
          <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag" style={{ ...IS, marginBottom: 12 }} />
          <button
            onClick={() => {
              const a = parseFloat(amt);
              if (!a) return;
              if (mode === "in") {
                if (a > balance) return noti("Onvoldoende", "err");
                setBalance((b) => b - a);
                setSavings((s) => s + a);
                addTx("savings", "Naar Spaarpot", -a);
              } else {
                if (a > savings) return noti("Onvoldoende", "err");
                setBalance((b) => b + a);
                setSavings((s) => s - a);
                addTx("savings", "Van Spaarpot", a);
              }
              setOk(true);
              noti("Gelukt!");
            }}
            style={BT(mode === "in" ? "#10B981" : SP.red)}
          >
            {mode === "in" ? "Inleggen" : "Opnemen"}
          </button>
        </div>
      )}
    </div>
  );
}
