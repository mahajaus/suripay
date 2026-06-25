"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SP, IS, BT } from "@/lib/ui";
import PinPad from "@/components/PinPad";
import { useDemo } from "../_components/DemoProvider";

function VersturenInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<"email" | "amount" | "pin" | "done">("email");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [balance, setBalance] = useState(0);
  const [hasPin, setHasPin] = useState(true);
  const [receiverName, setReceiverName] = useState("");
  const [fromCur, setFromCur] = useState("SRD");
  const [toCur, setToCur] = useState("SRD");

  const { fx, currencies } = useDemo();
  const rateOf = (c: string) =>
    currencies.find((x) => x.code === c)?.srd_per_unit ?? (c === "SRD" ? 1 : null);
  const symOf = (c: string) => currencies.find((x) => x.code === c)?.symbol ?? c;
  const balanceOf = (c: string) => (c === "SRD" ? balance : fx[c] ?? 0);
  const toAmount = () => {
    const fr = rateOf(fromCur);
    const tr = rateOf(toCur);
    const a = Number(amount);
    return a && fr && tr ? (a * fr) / tr : 0;
  };
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    background: active ? `${SP.gold}25` : "rgba(255,255,255,.05)",
    border: `1px solid ${active ? SP.gold : "rgba(255,255,255,.1)"}`,
    color: active ? SP.gold : "rgba(255,255,255,.6)",
  });
  const fmtN = (n: number) =>
    n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, pin_hash")
        .eq("user_id", user.id)
        .single();
      if (wallet) {
        setBalance(Number(wallet.balance));
        setHasPin(!!wallet.pin_hash);
      }

      // QR-deeplink: ontvanger + bedrag uit de URL.
      const to = params.get("to");
      const amt = params.get("amount");
      if (to) {
        const { data, error } = await supabase.rpc("find_wallet_by_email", {
          p_email: to,
        });
        if (!error && data?.found) {
          setEmail(to);
          setReceiverName(data.full_name);
          if (amt) setAmount(amt);
          setStep("amount");
        }
      }
    };
    load();
  }, [params]);

  const findReceiver = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.rpc("find_wallet_by_email", {
      p_email: email,
    });
    setLoading(false);
    if (error || !data?.found)
      return setError("Geen gebruiker gevonden met dit e-mailadres.");
    setReceiverName(data.full_name);
    setStep("amount");
  };

  const confirmAmount = () => {
    setError("");
    const v = Number(amount);
    if (!v || v <= 0) return setError("Voer een geldig bedrag in.");
    if (v > balanceOf(fromCur)) return setError("Onvoldoende saldo.");
    if (!hasPin)
      return setError("Stel eerst een PIN in via je profiel.");
    setStep("pin");
  };

  const onDigit = async (d: string) => {
    if (pin.length >= 6 || loading) return;
    const next = pin + d;
    setPin(next);
    if (next.length !== 6) return;

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError("Sessie verlopen. Log opnieuw in.");
      setPin("");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/transfers/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pin: next,
        amount: Math.round(Number(amount) * 100) / 100,
        receiver_email: email,
        description: description || null,
        from_currency: fromCur,
        to_currency: toCur,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      setError(data?.error || "Transactie mislukt.");
      setPin("");
      setLoading(false);
      return;
    }
    setStep("done");
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,.07)",
    borderRadius: 16,
    padding: 22,
    border: "1px solid rgba(255,255,255,.08)",
  };

  return (
    <div style={{ paddingTop: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        ↑ Versturen
      </h2>

      {error && (
        <p style={{ color: SP.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
          {error}
        </p>
      )}

      {step === "email" && (
        <div style={card}>
          <label style={{ fontSize: 12, opacity: 0.6 }}>
            E-mailadres ontvanger
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ontvanger@email.com"
            style={{ ...IS, margin: "6px 0 14px" }}
          />
          <button onClick={findReceiver} disabled={loading} style={BT(SP.green)}>
            {loading ? "Zoeken..." : "Volgende"}
          </button>
        </div>
      )}

      {step === "amount" && (
        <div style={card}>
          <p style={{ fontSize: 12, opacity: 0.5 }}>Naar</p>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
            {receiverName}
          </p>
          {currencies.length > 1 && (
            <>
              <label style={{ fontSize: 11, opacity: 0.6 }}>Je betaalt met</label>
              <div style={{ display: "flex", gap: 6, margin: "6px 0 10px", flexWrap: "wrap" }}>
                {currencies.map((c) => (
                  <button key={c.code} onClick={() => setFromCur(c.code)} style={pill(fromCur === c.code)}>
                    {c.code}
                  </button>
                ))}
              </div>
              <label style={{ fontSize: 11, opacity: 0.6 }}>Ontvanger krijgt</label>
              <div style={{ display: "flex", gap: 6, margin: "6px 0 12px", flexWrap: "wrap" }}>
                {currencies.map((c) => (
                  <button key={c.code} onClick={() => setToCur(c.code)} style={pill(toCur === c.code)}>
                    {c.code}
                  </button>
                ))}
              </div>
            </>
          )}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Bedrag (${fromCur})`}
            style={{ ...IS, marginBottom: 6 }}
          />
          <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 6 }}>
            Beschikbaar: {symOf(fromCur)} {fmtN(balanceOf(fromCur))}
          </p>
          {!!Number(amount) && rateOf(fromCur) && rateOf(toCur) && (
            <p style={{ fontSize: 12, color: SP.gold, fontWeight: 700, marginBottom: 12 }}>
              Ontvanger ontvangt ≈ {symOf(toCur)} {fmtN(toAmount())}
            </p>
          )}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Omschrijving (optioneel)"
            style={{ ...IS, marginBottom: 14 }}
          />
          <button onClick={confirmAmount} style={BT(SP.green)}>
            Volgende
          </button>
        </div>
      )}

      {step === "pin" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>
            Bevestig {symOf(fromCur)} {fmtN(Number(amount))} naar {receiverName}
            {fromCur !== toCur ? ` (ontvanger krijgt ${symOf(toCur)} ${fmtN(toAmount())})` : ""}
          </p>
          <p style={{ fontWeight: 700, marginBottom: 20 }}>Voer je PIN in</p>
          <PinPad
            value={pin}
            onDigit={onDigit}
            onDelete={() => setPin(pin.slice(0, -1))}
            disabled={loading}
          />
        </div>
      )}

      {step === "done" && (
        <div style={{ ...card, textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: SP.green,
              margin: "10px 0",
            }}
          >
            Verstuurd!
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {symOf(fromCur)} {fmtN(Number(amount))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 18 }}>
            aan {receiverName}
            {fromCur !== toCur ? ` · ${symOf(toCur)} ${fmtN(toAmount())} ontvangen` : ""}
          </div>
          <button
            onClick={() => router.push("/home")}
            style={{ ...BT(SP.gold, SP.ink), width: "auto", padding: "12px 28px" }}
          >
            ← Home
          </button>
        </div>
      )}
    </div>
  );
}

export default function VersturenPage() {
  return (
    <Suspense fallback={null}>
      <VersturenInner />
    </Suspense>
  );
}
