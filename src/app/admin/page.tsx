"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";
import { APP_BG, SP } from "@/lib/ui";

const LINKS = [
  { href: "/admin/kyc", ic: "🪪", l: "KYC-inzendingen", d: "Identiteit beoordelen" },
  { href: "/admin/topups", ic: "💳", l: "Opwaarderingen", d: "Inkomende stortingen crediteren" },
  { href: "/admin/withdrawals", ic: "🏧", l: "Opnames", d: "Uitbetalingen markeren" },
  { href: "/admin/koersen", ic: "💱", l: "Wisselkoersen", d: "Valutakoersen beheren" },
];

export default function AdminHub() {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState(isAdminEmail(user?.email) ? "ok" : "denied");
    });
  }, []);

  return (
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
      <a
        href="/home"
        style={{ color: SP.gold, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
      >
        ← Home
      </a>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: SP.gold, marginTop: 10 }}>
        🛠️ Beheer
      </h1>

      {state === "loading" && <p style={{ opacity: 0.4, marginTop: 12 }}>Laden…</p>}
      {state === "denied" && (
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>
          Geen toegang. Log in met een beheerdersaccount.
        </p>
      )}
      {state === "ok" && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {LINKS.map((x) => (
            <a
              key={x.href}
              href={x.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderRadius: 14,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <span style={{ fontSize: 22 }}>{x.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{x.l}</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>{x.d}</div>
              </div>
              <span style={{ opacity: 0.3 }}>›</span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
