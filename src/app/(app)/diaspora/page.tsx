"use client";

import { useDemo } from "../_components/DemoProvider";
import { PageTitle } from "../_components/kit";
import { BT, SP } from "@/lib/ui";

export default function DiasporaPage() {
  const { email, fullName, noti } = useDemo();

  const rows = [
    { l: "SuriPay ID", v: "SP-USER-001" },
    { l: "Naam", v: fullName || "—" },
    { l: "E-mail", v: email || "—" },
    { l: "Bank IBAN", v: "SR23 DSB 0000 9876" },
  ];

  return (
    <div>
      <PageTitle>🌍 Diaspora</PageTitle>
      <div style={{ background: "rgba(59,130,246,.08)", borderRadius: 16, padding: 20, border: "1px solid rgba(59,130,246,.15)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ontvangstgegevens</div>
        {rows.map((r) => (
          <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ fontSize: 11, opacity: 0.5 }}>{r.l}</span>
            <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>{r.v}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12, lineHeight: 1.6 }}>
          Compatibel met Wise, WorldRemit en Western Union.
        </div>
        <button onClick={() => noti("Gedeeld via WhatsApp!")} style={{ ...BT(SP.green), marginTop: 14 }}>
          💬 Deel via WhatsApp
        </button>
      </div>
    </div>
  );
}
