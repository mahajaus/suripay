"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDemo } from "../_components/DemoProvider";
import { Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, SP } from "@/lib/ui";

const fmt = (n: number) =>
  n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CurrencyPicker({
  currencies,
  value,
  onPick,
}: {
  currencies: { code: string }[];
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {currencies.map((c) => (
        <button
          key={c.code}
          onClick={() => onPick(c.code)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: value === c.code ? `${SP.gold}25` : "rgba(255,255,255,.05)",
            border: `1px solid ${value === c.code ? SP.gold : "rgba(255,255,255,.1)"}`,
            color: value === c.code ? SP.gold : "rgba(255,255,255,.6)",
          }}
        >
          {c.code}
        </button>
      ))}
    </div>
  );
}

export default function WisselenPage() {
  const { balance, fx, currencies, setBalance, setFx, noti } = useDemo();
  const [from, setFrom] = useState("SRD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [done, setDone] = useState<{ to: number; code: string } | null>(null);

  const rateOf = (c: string) =>
    currencies.find((x) => x.code === c)?.srd_per_unit ?? null;
  const symOf = (c: string) => currencies.find((x) => x.code === c)?.symbol ?? c;
  const balanceOf = (c: string) => (c === "SRD" ? balance : fx[c] ?? 0);

  const a = parseFloat(amount);
  const fr = rateOf(from);
  const tr = rateOf(to);
  const converted = a && fr && tr ? (a * fr) / tr : 0;

  const submit = async () => {
    if (!a || a <= 0) return noti("Voer een geldig bedrag in", "err");
    if (from === to) return noti("Kies twee verschillende valuta", "err");
    if (a > balanceOf(from)) return noti("Onvoldoende saldo", "err");
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ from, to, amount: a }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data?.success) return noti(data?.error || "Mislukt", "err");

    const toAmount = Number(data.to_amount);
    // Lokale saldi bijwerken.
    if (from === "SRD") setBalance((b) => b - a);
    else setFx((f) => ({ ...f, [from]: (f[from] ?? 0) - a }));
    if (to === "SRD") setBalance((b) => b + toAmount);
    else setFx((f) => ({ ...f, [to]: (f[to] ?? 0) + toAmount }));

    setDone({ to: toAmount, code: to });
    setOk(true);
  };

  if (ok && done)
    return (
      <div>
        <PageTitle>💱 Wisselen</PageTitle>
        <Succ
          title="Gewisseld!"
          extra={
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {symOf(done.code)} {fmt(done.to)}
            </div>
          }
        />
      </div>
    );

  if (currencies.length < 2)
    return (
      <div>
        <PageTitle>💱 Wisselen</PageTitle>
        <p style={{ opacity: 0.4, fontSize: 13 }}>Valuta worden geladen…</p>
      </div>
    );

  return (
    <div>
      <PageTitle sub="Wissel tussen je valuta">💱 Wisselen</PageTitle>

      <div style={card}>
        <label style={{ fontSize: 12, opacity: 0.6 }}>Van</label>
        <div style={{ margin: "6px 0 4px" }}>
          <CurrencyPicker currencies={currencies} value={from} onPick={setFrom} />
        </div>
        <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 12 }}>
          Beschikbaar: {symOf(from)} {fmt(balanceOf(from))}
        </p>

        <label style={{ fontSize: 12, opacity: 0.6 }}>Naar</label>
        <div style={{ margin: "6px 0 14px" }}>
          <CurrencyPicker currencies={currencies} value={to} onPick={setTo} />
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Bedrag (${from})`}
          style={{ ...IS, marginBottom: 12 }}
        />

        {!!converted && (
          <div
            style={{
              background: "rgba(230,184,0,.08)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Je ontvangt</span>
              <b style={{ color: SP.gold }}>
                {symOf(to)} {fmt(converted)}
              </b>
            </div>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
              Koers: 1 {from} = {fr && tr ? (fr / tr).toFixed(4) : "—"} {to}
            </div>
          </div>
        )}

        <button onClick={submit} disabled={loading} style={BT(loading ? "rgba(255,255,255,.2)" : SP.gold, SP.ink)}>
          {loading ? "Wisselen…" : "Wisselen"}
        </button>
      </div>
    </div>
  );
}
