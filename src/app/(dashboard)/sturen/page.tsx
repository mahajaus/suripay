"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SturenInner() {
  const [step, setStep] = useState<"email" | "amount" | "pin" | "done">("email");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [myWalletId, setMyWalletId] = useState("");
  const [balance, setBalance] = useState(0);
  const [receiverName, setReceiverName] = useState("");
  const [pinHash, setPinHash] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance, pin_hash")
        .eq("user_id", userData.user.id)
        .single();

      let myId = "";
      if (wallet) {
        myId = wallet.id;
        setMyWalletId(wallet.id);
        setBalance(Number(wallet.balance));
        setPinHash(wallet.pin_hash || "");
      }

      // Als we via een QR-scan komen, staan ontvanger + bedrag in de URL.
      const toParam = searchParams.get("to");
      const amountParam = searchParams.get("amount");

      if (toParam) {
        const { data, error } = await supabase.rpc("find_wallet_by_email", {
          p_email: toParam,
        });
        if (!error && data?.found && data.wallet_id !== myId) {
          setEmail(toParam);
          setReceiverName(data.full_name);
          if (amountParam) setAmount(amountParam);
          setStep("amount");
        }
      }
    };
    load();
  }, [searchParams]);

  // Stap 1: ontvanger zoeken
  const findReceiver = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.rpc("find_wallet_by_email", {
      p_email: email,
    });
    setLoading(false);

    if (error || !data?.found) {
      setError("Geen gebruiker gevonden met dit e-mailadres.");
      return;
    }
    if (data.wallet_id === myWalletId) {
      setError("Je kunt geen geld naar jezelf sturen.");
      return;
    }
    setReceiverName(data.full_name);
    setStep("amount");
  };

  // Stap 2: bedrag bevestigen
  const confirmAmount = () => {
    setError("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Voer een geldig bedrag in.");
      return;
    }
    if (value > balance) {
      setError("Onvoldoende saldo.");
      return;
    }
    if (!pinHash) {
      setError("Stel eerst een PIN in via je profiel.");
      return;
    }
    setStep("pin");
  };

  // Stap 3: PIN + transfer
  const handlePinDigit = async (digit: string) => {
    if (pin.length >= 6 || loading) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 6) {
      setLoading(true);

      // De PIN wordt server-side geverifieerd; de transfer loopt via de
      // route handler met de service-role (RLS-bypass), niet meer client-side.
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

      const roundedAmount = Math.round(Number(amount) * 100) / 100;

      const res = await fetch("/api/transfers/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pin: newPin,
          amount: roundedAmount,
          receiver_email: email,
          description: description || null,
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
    }
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
            Geld sturen
          </h1>
        </div>

        {error && (
          <p className="text-sm mb-4 text-red-500 text-center">{error}</p>
        )}

        {/* STAP 1: Email */}
        {step === "email" && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: "white" }}>
            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              E-mailadres ontvanger
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ontvanger@email.com"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4"
              style={{ borderColor: "var(--neutral-400)" }}
            />
            <button onClick={findReceiver} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--brand-green)" }}>
              {loading ? "Zoeken..." : "Volgende"}
            </button>
          </div>
        )}

        {/* STAP 2: Bedrag */}
        {step === "amount" && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: "white" }}>
            <p className="text-sm mb-1" style={{ color: "var(--neutral-600)" }}>
              Naar
            </p>
            <p className="font-semibold mb-4"
              style={{ color: "var(--neutral-900)" }}>
              {receiverName}
            </p>

            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Bedrag (SRD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border text-lg outline-none mb-3"
              style={{ borderColor: "var(--neutral-400)" }}
            />
            <p className="text-xs mb-4" style={{ color: "var(--neutral-400)" }}>
              Beschikbaar: SRD {balance.toFixed(2)}
            </p>

            <label className="block text-sm font-medium mb-1"
              style={{ color: "var(--neutral-800)" }}>
              Omschrijving (optioneel)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijv. lunch"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4"
              style={{ borderColor: "var(--neutral-400)" }}
            />

            <button onClick={confirmAmount}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--brand-green)" }}>
              Volgende
            </button>
          </div>
        )}

        {/* STAP 3: PIN */}
        {step === "pin" && (
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: "var(--neutral-600)" }}>
              Bevestig SRD {Number(amount).toFixed(2)} naar {receiverName}
            </p>
            <p className="font-semibold mb-6"
              style={{ color: "var(--neutral-900)" }}>
              Voer je PIN in
            </p>

            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: i < pin.length
                    ? "var(--brand-green)" : "var(--neutral-400)" }} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[1,2,3,4,5,6,7,8,9].map((num) => (
                <button key={num} onClick={() => handlePinDigit(String(num))}
                  disabled={loading}
                  className="text-2xl font-semibold py-4 rounded-2xl"
                  style={{ backgroundColor: "white" }}>
                  {num}
                </button>
              ))}
              <div></div>
              <button onClick={() => handlePinDigit("0")} disabled={loading}
                className="text-2xl font-semibold py-4 rounded-2xl"
                style={{ backgroundColor: "white" }}>
                0
              </button>
              <button onClick={() => setPin(pin.slice(0, -1))}
                className="text-xl py-4 rounded-2xl"
                style={{ backgroundColor: "white" }}>
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* STAP 4: Klaar */}
        {step === "done" && (
          <div className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: "white" }}>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2"
              style={{ color: "var(--brand-green)" }}>
              Gelukt!
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--neutral-600)" }}>
              SRD {Number(amount).toFixed(2)} verstuurd naar {receiverName}
            </p>
            <button onClick={() => window.location.href = "/dashboard"}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--brand-green)" }}>
              Terug naar dashboard
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

export default function SturenPage() {
  return (
    <Suspense fallback={null}>
      <SturenInner />
    </Suspense>
  );
}