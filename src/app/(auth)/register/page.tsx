"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP, IS, BT } from "@/lib/ui";

export default function RegisterPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Wachtwoorden komen niet overeen.");
    if (password.length < 6)
      return setError("Wachtwoord moet minimaal 6 tekens zijn.");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: naam } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  const shell = (children: React.ReactNode) => (
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
      <div style={{ width: "100%", maxWidth: 360 }}>{children}</div>
    </main>
  );

  if (success) {
    return shell(
      <div
        style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 20,
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>📧</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: SP.gold,
            margin: "10px 0",
          }}
        >
          Bijna klaar!
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
          We hebben een bevestigingsmail gestuurd naar{" "}
          <b>{email}</b>. Klik op de link in die e-mail om je account te
          bevestigen, daarna kun je inloggen.
        </p>
        <Link
          href="/login"
          style={{ ...BT(SP.gold, SP.ink), display: "block", marginTop: 18 }}
        >
          Naar inloggen
        </Link>
      </div>
    );
  }

  return shell(
    <form onSubmit={handleRegister}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: SP.gold }}>
          SuriPay
        </div>
        <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>
          Maak een account aan
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
        <input
          type="text"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Volledige naam"
          style={{ ...IS, marginBottom: 12 }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jouw@email.com"
          style={{ ...IS, marginBottom: 12 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Wachtwoord"
          style={{ ...IS, marginBottom: 12 }}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Bevestig wachtwoord"
          style={{ ...IS, marginBottom: 16 }}
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
          {loading ? "Bezig..." : "Account aanmaken"}
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
        Al een account?{" "}
        <Link href="/login" style={{ color: SP.gold, fontWeight: 700 }}>
          Inloggen
        </Link>
      </p>
    </form>
  );
}
