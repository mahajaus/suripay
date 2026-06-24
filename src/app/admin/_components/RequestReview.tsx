"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP, f$, fD } from "@/lib/ui";

type Item = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
  reference?: string | null;
  destination?: string | null;
};

// Herbruikbaar admin-beoordeelscherm voor opwaarderingen / opnames.
export default function RequestReview({
  endpoint,
  title,
  icon,
  approveLabel,
  detailKey,
  detailLabel,
}: {
  endpoint: string;
  title: string;
  icon: string;
  approveLabel: string;
  detailKey: "reference" | "destination";
  detailLabel: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${t}` } });
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
  }, [endpoint]);

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusy(id);
    setError("");
    const t = await token();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id, decision }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok || !data?.success) {
      setError(data?.error || "Actie mislukt.");
      return;
    }
    setItems((p) => p.filter((x) => x.id !== id));
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
        {icon} {title}
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
        {items.length} openstaand{items.length === 1 ? "" : "e"}
      </p>
      {error && <p style={{ color: SP.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {items.length === 0 ? (
        <p style={{ opacity: 0.4, fontSize: 13 }}>Niets openstaand.</p>
      ) : (
        items.map((it) => (
          <div
            key={it.id}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{it.full_name || "Naamloos"}</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{it.email}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: SP.gold }}>{f$(it.amount)}</div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
              {detailLabel}: <b>{it[detailKey] || "—"}</b> · {it.method} · {fD(it.created_at)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => decide(it.id, "approve")}
                disabled={busy === it.id}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: SP.green, color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                ✓ {approveLabel}
              </button>
              <button
                onClick={() => decide(it.id, "reject")}
                disabled={busy === it.id}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${SP.red}`, background: "rgba(231,76,60,.12)", color: SP.red, fontWeight: 700, cursor: "pointer" }}
              >
                ✕ Afwijzen
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
