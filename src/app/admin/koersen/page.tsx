"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP } from "@/lib/ui";

type Cur = {
  code: string;
  name: string;
  symbol: string;
  srd_per_unit: number;
  enabled: boolean;
};

export default function KoersenPage() {
  const [items, setItems] = useState<Cur[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const token = async () =>
    (await supabase.auth.getSession()).data.session?.access_token;

  useEffect(() => {
    const load = async () => {
      const t = await token();
      if (!t) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/rates", { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 403) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const setField = (code: string, patch: Partial<Cur>) =>
    setItems((p) => p.map((c) => (c.code === code ? { ...c, ...patch } : c)));

  const save = async (c: Cur) => {
    setBusy(c.code);
    setMsg("");
    const t = await token();
    const res = await fetch("/api/admin/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({
        code: c.code,
        srd_per_unit: c.srd_per_unit,
        enabled: c.enabled,
      }),
    });
    const data = await res.json();
    setBusy(null);
    setMsg(res.ok && data?.success ? `${c.code} opgeslagen` : data?.error || "Mislukt");
    setTimeout(() => setMsg(""), 2500);
  };

  const shell = (children: React.ReactNode) => (
    <main
      style={{
        minHeight: "100vh",
        background: APP_BG,
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
        maxWidth: 560,
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >
      <a href="/admin" style={{ color: SP.gold, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
        ← Beheer
      </a>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: SP.gold, margin: "10px 0 4px" }}>
        💱 Wisselkoersen
      </h1>
      {children}
    </main>
  );

  if (loading) return shell(<p style={{ opacity: 0.4, marginTop: 12 }}>Laden…</p>);
  if (denied)
    return shell(
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>
        Geen toegang. Log in met een beheerdersaccount.
      </p>
    );

  return shell(
    <div>
      <p style={{ fontSize: 12, opacity: 0.5, margin: "4px 0 16px" }}>
        Koers = waarde van 1 eenheid in SRD. SRD is de basis (vast op 1).
      </p>
      {msg && <p style={{ color: SP.gold, fontSize: 13, marginBottom: 12 }}>{msg}</p>}

      {items.map((c) => (
        <div
          key={c.code}
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {c.symbol} {c.code} <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>· {c.name}</span>
            </div>
            <label style={{ fontSize: 11, opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => setField(c.code, { enabled: e.target.checked })}
              />
              actief
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap" }}>1 {c.code} =</span>
            <input
              type="number"
              step="0.0001"
              value={c.srd_per_unit}
              disabled={c.code === "SRD"}
              onChange={(e) => setField(c.code, { srd_per_unit: Number(e.target.value) })}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                outline: "none",
                opacity: c.code === "SRD" ? 0.5 : 1,
              }}
            />
            <span style={{ fontSize: 11, opacity: 0.5 }}>SRD</span>
            <button
              onClick={() => save(c)}
              disabled={busy === c.code}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: SP.gold,
                color: SP.ink,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {busy === c.code ? "…" : "Opslaan"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
