"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: naam },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  // Succes scherm na registratie
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--brand-light)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="rounded-2xl p-8" style={{ backgroundColor: "white" }}>
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-xl font-bold mb-3"
              style={{ color: "var(--brand-green)" }}>
              Bijna klaar!
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--neutral-600)" }}>
              We hebben een bevestigingsmail gestuurd naar{" "}
              <span className="font-semibold">{email}</span>.
              <br /><br />
              Klik op de link in die e-mail om je account te bevestigen.
              Daarna kun je inloggen.
            </p>
            <Link href="/login"
              className="block w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--brand-green)" }}>
              Naar inloggen
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            Maak een account aan
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: "white" }}>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Volledige naam
            </label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Jay Mahabir"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "var(--neutral-400)",
                       color: "var(--neutral-900)" }}
            />
          </div>

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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none"
                style={{ borderColor: "var(--neutral-400)",
                         color: "var(--neutral-900)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: "var(--neutral-600)" }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Bevestig wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none"
                style={{ borderColor: "var(--neutral-400)",
                         color: "var(--neutral-900)" }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm mb-4 text-red-500">{error}</p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: loading
              ? "var(--neutral-400)"
              : "var(--brand-green)" }}>
            {loading ? "Bezig..." : "Account aanmaken"}
          </button>

          <p className="text-xs text-center mt-4"
            style={{ color: "var(--neutral-400)" }}>
            Na registratie ontvang je een bevestigingsmail.
          </p>
        </div>

        <p className="text-center text-sm mt-4"
          style={{ color: "var(--neutral-600)" }}>
          Al een account?{" "}
          <Link href="/login"
            style={{ color: "var(--brand-green)" }}
            className="font-semibold">
            Inloggen
          </Link>
        </p>

      </div>
    </main>
  );
}