"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SP } from "@/lib/ui";
import { isAdminEmail } from "@/lib/admin";

export default function ProfielPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setAdmin(isAdminEmail(user.email));
      const { data: wallet } = await supabase
        .from("wallets")
        .select("tier")
        .eq("user_id", user.id)
        .single();
      if (wallet) setTier(wallet.tier);
    };
    load();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const rows = [
    { ic: "🪪", t: "KYC-niveau", s: tier || "—", href: "/kyc" },
    { ic: "🔐", t: "PIN wijzigen", s: "6-cijferige PIN", href: "/pin" },
    ...(admin
      ? [{ ic: "🛠️", t: "Beheer", s: "KYC · opwaarderen · opnames", href: "/admin" }]
      : []),
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
        👤 Profiel
      </h2>

      <div
        style={{
          background: "rgba(255,255,255,.07)",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${SP.gold},${SP.green})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
            color: SP.ink,
          }}
        >
          {(fullName || email || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {fullName || "Naamloos"}
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {email}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,.06)",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 14,
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        {rows.map((r, i) => (
          <button
            key={r.t}
            onClick={() => router.push(r.href)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderBottom:
                i < rows.length - 1
                  ? "1px solid rgba(255,255,255,.05)"
                  : "none",
              cursor: "pointer",
              color: "#fff",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 20 }}>{r.ic}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.t}</div>
              <div style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase" }}>
                {r.s}
              </div>
            </div>
            <span style={{ opacity: 0.3 }}>›</span>
          </button>
        ))}
      </div>

      <button
        onClick={logout}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 12,
          background: "rgba(231,76,60,.1)",
          border: "1px solid rgba(231,76,60,.2)",
          color: SP.red,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        🔒 Uitloggen
      </button>
    </div>
  );
}
