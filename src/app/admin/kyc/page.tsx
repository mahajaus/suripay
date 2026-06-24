"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP } from "@/lib/ui";

type Item = {
  id: string;
  user_id: string;
  requested_tier: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
  selfie_url: string | null;
  id_doc_url: string | null;
};

export default function AdminKycPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const getToken = async () =>
    (await supabase.auth.getSession()).data.session?.access_token;

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (!token) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/kyc/review", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusy(id);
    setError("");
    const token = await getToken();
    const res = await fetch("/api/kyc/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      {children}
    </main>
  );

  if (loading) return shell(<p style={{ opacity: 0.4 }}>Laden…</p>);

  if (denied)
    return shell(
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: SP.gold }}>
          🛠️ KYC-beheer
        </h1>
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>
          Geen toegang. Log in met een beheerdersaccount.
        </p>
      </div>
    );

  return shell(
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: SP.gold }}>
        🛠️ KYC-beheer
      </h1>
      <p style={{ fontSize: 12, opacity: 0.5, margin: "4px 0 16px" }}>
        {items.length} openstaande inzending{items.length === 1 ? "" : "en"}
      </p>

      {error && (
        <p style={{ color: SP.red, fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {items.length === 0 ? (
        <p style={{ opacity: 0.4, fontSize: 13 }}>Geen openstaande inzendingen.</p>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {it.full_name || "Naamloos"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{it.email}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: `${SP.gold}25`,
                  color: SP.gold,
                  padding: "3px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                }}
              >
                → {it.requested_tier}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {it.selfie_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.selfie_url}
                  alt="selfie"
                  style={{ width: "50%", borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                <Placeholder label="geen selfie" />
              )}
              {it.id_doc_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.id_doc_url}
                  alt="id"
                  style={{ width: "50%", borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                <Placeholder label="geen ID" />
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => decide(it.id, "approve")}
                disabled={busy === it.id}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: SP.green,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✓ Goedkeuren
              </button>
              <button
                onClick={() => decide(it.id, "reject")}
                disabled={busy === it.id}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${SP.red}`,
                  background: "rgba(231,76,60,.12)",
                  color: SP.red,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
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

function Placeholder({ label }: { label: string }) {
  return (
    <div
      style={{
        width: "50%",
        aspectRatio: "1",
        borderRadius: 12,
        background: "rgba(255,255,255,.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        opacity: 0.4,
      }}
    >
      {label}
    </div>
  );
}
