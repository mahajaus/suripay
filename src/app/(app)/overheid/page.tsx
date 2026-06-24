"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Opt, Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";
import { GOV_SERVICES } from "@/lib/demo";

export default function OverheidPage() {
  const { balance, setBalance, addTx, noti } = useDemo();
  const [sub, setSub] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);
  const [last, setLast] = useState(0);

  const svc = GOV_SERVICES.find((g) => g.id === sub);

  if (ok)
    return (
      <div>
        <PageTitle>🏛️ Overheidsdiensten</PageTitle>
        <Succ title="Betaald!" extra={<div style={{ fontSize: 22, fontWeight: 800 }}>{f$(last)}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle>🏛️ Overheidsdiensten</PageTitle>
      {!sub ? (
        <Opt items={GOV_SERVICES.map((g) => ({ id: g.id, ic: g.ic, l: g.n, d: g.desc, c: g.c, onClick: () => setSub(g.id) }))} />
      ) : (
        svc && (
          <div>
            <Back onClick={() => setSub(null)} />
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><span style={{ fontSize: 28 }}>{svc.ic}</span><span style={{ fontSize: 15, fontWeight: 700 }}>{svc.n}</span></div>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Referentienummer" style={{ ...IS, marginBottom: 10 }} />
              <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
              <button
                onClick={() => {
                  const a = parseFloat(amt);
                  if (!a || a > balance) return noti("Onvoldoende saldo", "err");
                  setBalance((b) => b - a);
                  addTx("gov", svc.n, -a);
                  setLast(a);
                  setOk(true);
                  noti(`${svc.n} betaald!`);
                }}
                style={BT(svc.c)}
              >
                Betalen
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
