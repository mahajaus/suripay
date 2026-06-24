"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Opt, Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";
import { AGRI } from "@/lib/demo";

export default function LandbouwPage() {
  const { setBalance, addTx, noti } = useDemo();
  const [sub, setSub] = useState<string | null>(null);
  const [party, setParty] = useState("");
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);
  const [last, setLast] = useState(0);

  const svc = AGRI.find((a) => a.id === sub);

  if (ok)
    return (
      <div>
        <PageTitle>🌾 Landbouw</PageTitle>
        <Succ title="Betaling ontvangen!" extra={<div style={{ fontSize: 22, fontWeight: 800 }}>{f$(last)}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle>🌾 Landbouw</PageTitle>
      {!sub ? (
        <Opt items={AGRI.map((a) => ({ id: a.id, ic: a.ic, l: a.n, d: a.desc, c: a.c, onClick: () => setSub(a.id) }))} />
      ) : (
        svc && (
          <div>
            <Back onClick={() => setSub(null)} />
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><span style={{ fontSize: 28 }}>{svc.ic}</span><span style={{ fontSize: 15, fontWeight: 700 }}>{svc.n}</span></div>
              <input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Partij / naam" style={{ ...IS, marginBottom: 10 }} />
              <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
              <button
                onClick={() => {
                  const a = parseFloat(amt);
                  if (!a) return noti("Voer een bedrag in", "err");
                  setBalance((b) => b + a);
                  addTx("agri", svc.n, a);
                  setLast(a);
                  setOk(true);
                  noti("Betaling ontvangen!");
                }}
                style={BT(svc.c)}
              >
                Betaling ontvangen
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
