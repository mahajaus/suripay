"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Verkeerd e-mailadres of wachtwoord.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--brand-light)" }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold"
            style={{ color: "var(--brand-green)" }}>
            SuriPay
          </h1>
          <p className="text-sm mt-1"
            style={{ color: "var(--neutral-600)" }}>
            Welkom terug
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: "white" }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.com"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "var(--neutral-400)",
                       color: "var(--neutral-900)" }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "var(--neutral-400)",
                       color: "var(--neutral-900)" }}
            />
          </div>

          {error && (
            <p className="text-sm mb-4 text-red-500">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: loading
              ? "var(--neutral-400)"
              : "var(--brand-green)" }}>
            {loading ? "Bezig..." : "Inloggen"}
          </button>
        </div>

        <p className="text-center text-sm mt-4"
          style={{ color: "var(--neutral-600)" }}>
          Nog geen account?{" "}
          <Link href="/register"
            style={{ color: "var(--brand-green)" }}
            className="font-semibold">
            Registreren
          </Link>
        </p>

      </div>
    </main>
  );
}