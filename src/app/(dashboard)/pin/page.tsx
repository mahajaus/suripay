"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export default function PinPage() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) window.location.href = "/login";
    };
    check();
  }, []);

  const handleDigit = (digit: string) => {
    setError("");
    if (step === "enter") {
      if (pin.length < 6) setPin(pin + digit);
    } else {
      if (confirmPin.length < 6) setConfirmPin(confirmPin + digit);
    }
  };

  const handleDelete = () => {
    if (step === "enter") setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
  };

  useEffect(() => {
    if (step === "enter" && pin.length === 6) {
      setStep("confirm");
    }
  }, [pin, step]);

  useEffect(() => {
    const savePin = async () => {
      if (step === "confirm" && confirmPin.length === 6) {
        if (pin !== confirmPin) {
          setError("PINs komen niet overeen. Probeer opnieuw.");
          setPin("");
          setConfirmPin("");
          setStep("enter");
          return;
        }

        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const hash = await bcrypt.hash(pin, 10);

        const { error } = await supabase
          .from("wallets")
          .update({ pin_hash: hash })
          .eq("user_id", userData.user!.id);

        if (error) {
          setError("Er ging iets mis. Probeer opnieuw.");
          setLoading(false);
          return;
        }

        window.location.href = "/dashboard";
      }
    };
    savePin();
  }, [confirmPin, step, pin]);

  const activePin = step === "enter" ? pin : confirmPin;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--brand-light)" }}>
      <div className="w-full max-w-sm text-center">

        <h1 className="text-2xl font-bold mb-2"
          style={{ color: "var(--brand-green)" }}>
          {step === "enter" ? "Kies je PIN" : "Bevestig je PIN"}
        </h1>
        <p className="text-sm mb-8"
          style={{ color: "var(--neutral-600)" }}>
          {step === "enter"
            ? "Maak een 6-cijferige PIN aan"
            : "Voer je PIN nogmaals in"}
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i}
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: i < activePin.length
                  ? "var(--brand-green)"
                  : "var(--neutral-400)",
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm mb-4 text-red-500">{error}</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num}
              onClick={() => handleDigit(String(num))}
              disabled={loading}
              className="text-2xl font-semibold py-4 rounded-2xl"
              style={{ backgroundColor: "white",
                       color: "var(--neutral-900)" }}>
              {num}
            </button>
          ))}
          <div></div>
          <button
            onClick={() => handleDigit("0")}
            disabled={loading}
            className="text-2xl font-semibold py-4 rounded-2xl"
            style={{ backgroundColor: "white",
                     color: "var(--neutral-900)" }}>
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xl py-4 rounded-2xl"
            style={{ backgroundColor: "white",
                     color: "var(--neutral-600)" }}>
            ⌫
          </button>
        </div>

      </div>
    </main>
  );
}