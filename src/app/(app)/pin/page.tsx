"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SP, BT } from "@/lib/ui";
import PinPad from "@/components/PinPad";

type Phase = "current" | "new" | "confirm" | "done";

export default function PinPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("new");
  const [hasPin, setHasPin] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: wallet } = await supabase
        .from("wallets")
        .select("pin_hash")
        .eq("user_id", user.id)
        .single();
      if (wallet?.pin_hash) {
        setHasPin(true);
        setPhase("current");
      }
    });
  }, []);

  const save = async (currentPin: string, newPin: string) => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/pin/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPin: hasPin ? currentPin : undefined, newPin }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data?.success) {
      if (data?.error?.includes("Huidige PIN")) {
        setError("Huidige PIN is onjuist.");
        setCurrent("");
        setNext("");
        setConfirm("");
        setPhase("current");
      } else {
        setError(data?.error || "Er ging iets mis. Probeer opnieuw.");
        setNext("");
        setConfirm("");
        setPhase("new");
      }
      return;
    }
    setPhase("done");
  };

  const value =
    phase === "current" ? current : phase === "new" ? next : confirm;

  const onDigit = (d: string) => {
    setError("");
    if (loading || value.length >= 6) return;

    if (phase === "current") {
      const v = current + d;
      setCurrent(v);
      if (v.length === 6) setPhase("new");
      return;
    }
    if (phase === "new") {
      const v = next + d;
      setNext(v);
      if (v.length === 6) setPhase("confirm");
      return;
    }
    const v = confirm + d;
    setConfirm(v);
    if (v.length < 6) return;
    if (next !== v) {
      setError("PINs komen niet overeen. Probeer opnieuw.");
      setNext("");
      setConfirm("");
      setPhase("new");
      return;
    }
    save(current, next);
  };

  const onDelete = () => {
    if (phase === "current") setCurrent(current.slice(0, -1));
    else if (phase === "new") setNext(next.slice(0, -1));
    else if (phase === "confirm") setConfirm(confirm.slice(0, -1));
  };

  const title =
    phase === "current"
      ? "Voer je huidige PIN in"
      : phase === "new"
      ? "Kies je nieuwe PIN"
      : "Bevestig je nieuwe PIN";

  return (
    <div style={{ paddingTop: 12, textAlign: "center" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        🔐 PIN instellen
      </h2>

      {phase === "done" ? (
        <div
          style={{
            background: "rgba(37,211,102,.1)",
            border: "1px solid rgba(37,211,102,.2)",
            borderRadius: 16,
            padding: 28,
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 48 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: SP.green, margin: "10px 0 18px" }}>
            Je PIN is ingesteld
          </div>
          <button
            onClick={() => router.push("/profiel")}
            style={{ ...BT(SP.gold, SP.ink), width: "auto", padding: "12px 28px" }}
          >
            ← Profiel
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, opacity: 0.6, margin: "8px 0 24px" }}>{title}</p>
          {error && (
            <p style={{ color: SP.red, fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}
          <PinPad value={value} onDigit={onDigit} onDelete={onDelete} disabled={loading} />
        </>
      )}
    </div>
  );
}
