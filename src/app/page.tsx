"use client";

import Link from "next/link";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP, BT } from "@/lib/ui";

export default function Home() {
  // Al ingelogd? Direct door naar de app.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/home";
    });
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: APP_BG,
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 8 }}>🇸🇷</div>
      <h1 style={{ fontSize: 40, fontWeight: 800, color: SP.gold }}>SuriPay</h1>
      <p style={{ fontSize: 15, opacity: 0.5, marginBottom: 28 }}>
        Suriname&apos;s digitale wallet
      </p>
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
        <Link href="/login" style={{ ...BT(SP.gold, SP.ink), flex: 1 }}>
          Inloggen
        </Link>
        <Link
          href="/register"
          style={{
            ...BT("transparent"),
            flex: 1,
            border: `1px solid ${SP.gold}`,
            color: SP.gold,
          }}
        >
          Registreren
        </Link>
      </div>
    </main>
  );
}
