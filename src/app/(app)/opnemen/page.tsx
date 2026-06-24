"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";

export default function OpnemenPage() {
  const { balance, setBalance, addTx, noti } = useDemo();
  const [method, setMethod] = useState<"bank" | "agent">("bank");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [last, setLast] = useState(0);

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return noti("Voer een geldig bedrag in", "err");
    if (a > balance) return noti("Onvoldoende saldo", "err");
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ amount: a, method, destination }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data?.success) return noti(data?.error || "Mislukt", "err");
    // Bedrag is server-side gereserveerd → weerspiegel het in de UI.
    setBalance((b) => b - a);
    addTx("cashout", "Opname (in behandeling)", -a);
    setLast(a);
    setOk(true);
  };

  if (ok)
    return (
      <div>
        <PageTitle>🏧 Opnemen</PageTitle>
        <Succ
          title="Opname aangevraagd"
          extra={
            <>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{f$(last)}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                Het bedrag is gereserveerd en wordt na verwerking uitbetaald.
              </div>
            </>
          }
        />
      </div>
    );

  return (
    <div>
      <PageTitle sub={`Beschikbaar: ${f$(balance)}`}>🏧 Opnemen</PageTitle>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["bank", "agent"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              background: method === m ? "rgba(168,85,247,.2)" : "rgba(255,255,255,.05)",
              border: `1px solid ${method === m ? "#a855f7" : "rgba(255,255,255,.08)"}`,
              color: method === m ? "#c89bff" : "rgba(255,255,255,.6)",
            }}
          >
            {m === "bank" ? "🏦 Bankrekening" : "🏪 Agent (contant)"}
          </button>
        ))}
      </div>

      <div style={card}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Bedrag (SRD)"
          style={{ ...IS, marginBottom: 12 }}
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={method === "bank" ? "IBAN / rekeningnummer" : "Agent / locatie"}
          style={{ ...IS, marginBottom: 14 }}
        />
        <button onClick={submit} disabled={loading} style={BT(loading ? "rgba(255,255,255,.2)" : "#a855f7")}>
          {loading ? "Versturen…" : "Opname aanvragen"}
        </button>
      </div>
    </div>
  );
}
