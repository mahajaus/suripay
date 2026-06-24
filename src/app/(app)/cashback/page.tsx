"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle } from "../_components/kit";
import { BT, f$ } from "@/lib/ui";

export default function CashbackPage() {
  const { setBalance, cashback, setCashback, addTx, noti } = useDemo();
  const [ok, setOk] = useState(false);

  if (ok)
    return (
      <div>
        <PageTitle>🎁 Cashback</PageTitle>
        <Succ title="Uitbetaald!" />
      </div>
    );

  return (
    <div>
      <PageTitle>🎁 Cashback</PageTitle>

      <div style={{ background: "rgba(245,158,11,.1)", borderRadius: 16, padding: 20, border: "1px solid rgba(245,158,11,.15)", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>CASHBACK TEGOED</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{f$(cashback)}</div>
        <div style={{ fontSize: 11, opacity: 0.4 }}>2% op alle betalingen</div>
      </div>

      <button
        onClick={() => {
          if (cashback <= 0) return noti("Geen cashback", "err");
          setBalance((b) => b + cashback);
          addTx("cashback", "Cashback uitbetaald", cashback);
          setCashback(0);
          setOk(true);
          noti("Cashback uitbetaald!");
        }}
        style={BT("#F59E0B", "#0B3D2E")}
      >
        Uitbetalen naar wallet
      </button>
    </div>
  );
}
