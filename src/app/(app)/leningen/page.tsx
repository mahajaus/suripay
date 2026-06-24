"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle } from "../_components/kit";
import { BT, SP } from "@/lib/ui";

export default function LeningenPage() {
  const { noti } = useDemo();
  const [ok, setOk] = useState(false);

  if (ok)
    return (
      <div>
        <PageTitle>🏦 Leningen & BNPL</PageTitle>
        <Succ title="BNPL goedgekeurd!" />
      </div>
    );

  return (
    <div>
      <PageTitle>🏦 Leningen & BNPL</PageTitle>

      <div style={{ background: "rgba(0,102,179,.08)", borderRadius: 14, padding: 16, border: "1px solid rgba(0,102,179,.15)", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 11, opacity: 0.5 }}>KREDIETLIMIET</div><div style={{ fontSize: 20, fontWeight: 800 }}>SRD 2.500</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, opacity: 0.5 }}>BESCHIKBAAR</div><div style={{ fontSize: 20, fontWeight: 800, color: SP.green }}>SRD 2.000</div></div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontWeight: 700 }}>Fernandes</span><span style={{ color: SP.gold }}>SRD 89 resterend</span></div>
        <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 6, height: 6, overflow: "hidden" }}><div style={{ height: "100%", background: SP.green, width: "82%", borderRadius: 6 }} /></div>
        <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6 }}>SRD 89/maand · 82% betaald</div>
      </div>

      <button onClick={() => { setOk(true); noti("BNPL goedgekeurd!"); }} style={BT("#0066B3")}>
        Nieuwe BNPL-aanvraag
      </button>
    </div>
  );
}
