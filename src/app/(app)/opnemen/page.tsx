"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Opt, Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";

export default function OpnemenPage() {
  const { balance, setBalance, addTx, noti } = useDemo();
  const [sub, setSub] = useState<string | null>(null);
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);
  const [last, setLast] = useState(0);

  if (ok)
    return (
      <div>
        <PageTitle>🏧 Opnemen</PageTitle>
        <Succ title="Opname aangevraagd!" extra={<div style={{ fontSize: 22, fontWeight: 800 }}>{f$(last)}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle>🏧 Opnemen</PageTitle>
      {!sub ? (
        <Opt
          items={[
            { id: "bank", ic: "🏦", l: "Bankrekening", d: "1-2 werkdagen", c: "#3b82f6", onClick: () => setSub("bank") },
            { id: "agent", ic: "🏪", l: "Agent (contant)", d: "Ophaalcode ontvangen", c: "#10B981", onClick: () => setSub("agent") },
          ]}
        />
      ) : (
        <div>
          <Back onClick={() => setSub(null)} />
          <div style={card}>
            <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
            <button
              onClick={() => {
                const a = parseFloat(amt);
                if (!a || a > balance) return noti("Onvoldoende saldo", "err");
                setBalance((b) => b - a);
                addTx("cashout", sub === "bank" ? "Opname bank" : "Opname agent", -a);
                setLast(a);
                setOk(true);
                noti("Aangevraagd!");
              }}
              style={BT("#a855f7")}
            >
              Opnemen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
