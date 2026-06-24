"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, SP } from "@/lib/ui";

export default function OpwaarderenPage() {
  const { noti } = useDemo();
  const [method, setMethod] = useState<"bank" | "agent">("bank");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return noti("Voer een geldig bedrag in", "err");
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/topup/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ amount: a, method, reference }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data?.success) return noti(data?.error || "Mislukt", "err");
    setOk(true);
  };

  if (ok)
    return (
      <div>
        <PageTitle>💳 Opwaarderen</PageTitle>
        <Succ
          title="Verzoek ingediend"
          extra={
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>
              Je saldo wordt opgehoogd zodra we je storting hebben bevestigd.
            </div>
          }
        />
      </div>
    );

  return (
    <div>
      <PageTitle sub="Stort geld op je wallet">💳 Opwaarderen</PageTitle>

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
              background: method === m ? "rgba(230,184,0,.2)" : "rgba(255,255,255,.05)",
              border: `1px solid ${method === m ? SP.gold : "rgba(255,255,255,.08)"}`,
              color: method === m ? SP.gold : "rgba(255,255,255,.6)",
            }}
          >
            {m === "bank" ? "🏦 Bankoverschrijving" : "🏪 Agent (contant)"}
          </button>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 14 }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Bedrag (SRD)"
          style={{ ...IS, marginBottom: 12 }}
        />
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={method === "bank" ? "Jouw overschrijvingskenmerk" : "Agent / locatie (optioneel)"}
          style={{ ...IS, marginBottom: 14 }}
        />
        <button onClick={submit} disabled={loading} style={BT(loading ? "rgba(255,255,255,.2)" : SP.gold, SP.ink)}>
          {loading ? "Versturen…" : "Verzoek indienen"}
        </button>
      </div>

      {method === "bank" && (
        <div style={{ ...card, fontSize: 12, opacity: 0.8, lineHeight: 1.7 }}>
          <b style={{ color: SP.gold }}>Zo werkt het</b>
          <br />
          1. Maak het bedrag over naar <b>SuriPay Beheer — DSB SR23 0000 9876</b>.
          <br />
          2. Vermeld je kenmerk bij de overschrijving.
          <br />
          3. Na bevestiging verschijnt het saldo in je wallet.
        </div>
      )}
    </div>
  );
}
