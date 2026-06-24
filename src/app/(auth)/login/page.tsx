"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP, IS, BT } from "@/lib/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Verkeerd e-mailadres of wachtwoord.");
      setLoading(false);
      return;
    }
    window.location.href = "/home";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: APP_BG,
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🇸🇷</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: SP.gold }}>
            SuriPay
          </div>
          <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>
            Welkom terug
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 20,
            padding: 22,
          }}
        >
          <label style={{ fontSize: 12, opacity: 0.6 }}>E-mailadres</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jouw@email.com"
            style={{ ...IS, margin: "6px 0 14px" }}
          />
          <label style={{ fontSize: 12, opacity: 0.6 }}>Wachtwoord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ ...IS, margin: "6px 0 16px" }}
          />
          {error && (
            <p style={{ color: SP.red, fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={BT(loading ? "rgba(255,255,255,.2)" : SP.gold, SP.ink)}
          >
            {loading ? "Bezig..." : "Inloggen"}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            opacity: 0.7,
            marginTop: 16,
          }}
        >
          Nog geen account?{" "}
          <Link href="/register" style={{ color: SP.gold, fontWeight: 700 }}>
            Registreren
          </Link>
        </p>
      </form>
    </main>
  );
}
