"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function OntvangenPage() {
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setEmail(data.user.email || "");
      setNaam(data.user.user_metadata?.full_name || "");
    };
    load();
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "var(--neutral-100)" }}>
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center mb-8">
          <button onClick={() => window.location.href = "/dashboard"}
            className="text-2xl mr-3"
            style={{ color: "var(--neutral-600)" }}>
            ←
          </button>
          <h1 className="text-xl font-bold"
            style={{ color: "var(--neutral-900)" }}>
            Geld ontvangen
          </h1>
        </div>

        <div className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: "white" }}>

          <div className="text-5xl mb-4">↓</div>

          <p className="text-sm mb-1" style={{ color: "var(--neutral-600)" }}>
            Deel je e-mailadres om geld te ontvangen
          </p>
          <p className="font-semibold mb-6"
            style={{ color: "var(--neutral-900)" }}>
            {naam}
          </p>

          <div className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: "var(--brand-light)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--neutral-600)" }}>
              Jouw SuriPay e-mailadres
            </p>
            <p className="font-semibold break-all"
              style={{ color: "var(--brand-green)" }}>
              {email}
            </p>
          </div>

          <button onClick={copyEmail}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: copied
              ? "var(--neutral-400)"
              : "var(--brand-green)" }}>
            {copied ? "Gekopieerd! ✓" : "Kopieer e-mailadres"}
          </button>

          <p className="text-xs mt-4" style={{ color: "var(--neutral-400)" }}>
            Iedereen met een SuriPay account kan geld naar dit
            e-mailadres sturen.
          </p>
        </div>

      </div>
    </main>
  );
}