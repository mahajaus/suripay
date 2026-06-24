"use client";

import { useDemo } from "../_components/DemoProvider";
import { PageTitle } from "../_components/kit";
import { f$ } from "@/lib/ui";
import { INSURANCE } from "@/lib/demo";

export default function VerzekeringPage() {
  const { setBalance, insurances, setInsurances, addTx, noti } = useDemo();

  return (
    <div>
      <PageTitle>🛡️ Micro-verzekeringen</PageTitle>
      {INSURANCE.map((ins) => {
        const active = insurances.includes(ins.id);
        return (
          <div key={ins.id} style={{ background: "rgba(255,255,255,.05)", borderRadius: 14, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: ins.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ins.ic}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{ins.n}</div>
              <div style={{ fontSize: 10, opacity: 0.4 }}>{ins.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ins.c, marginTop: 2 }}>{f$(ins.price)}/mnd</div>
            </div>
            <button
              onClick={() => {
                if (active) {
                  setInsurances((p) => p.filter((x) => x !== ins.id));
                  noti(`${ins.n} opgezegd`);
                } else {
                  setInsurances((p) => [...p, ins.id]);
                  setBalance((b) => b - ins.price);
                  addTx("insurance", ins.n, -ins.price);
                  noti(`${ins.n} actief!`);
                }
              }}
              style={{ padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", background: active ? `${ins.c}20` : "rgba(255,255,255,.05)", border: `1px solid ${active ? ins.c : "rgba(255,255,255,.08)"}`, color: active ? ins.c : "rgba(255,255,255,.5)" }}
            >
              {active ? "Actief ✓" : "Activeer"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
