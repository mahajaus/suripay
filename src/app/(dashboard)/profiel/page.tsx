"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

type Step = "view" | "current" | "new" | "confirm" | "done";

export default function ProfielPage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pinHash, setPinHash] = useState("");

  const [step, setStep] = useState<Step>("view");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setUser(userData.user);
      setFullName(userData.user.user_metadata?.full_name || "");
      setEmail(userData.user.email || "");

      const { data: wallet } = await supabase
        .from("wallets")
        .select("pin_hash")
        .eq("user_id", userData.user.id)
        .single();

      if (wallet) setPinHash(wallet.pin_hash || "");
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Open de PIN-wijzig-flow. Heb je nog geen PIN, dan slaan we de oude-PIN-stap over.
  const startPinChange = () => {
    setError("");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setStep(pinHash ? "current" : "new");
  };

  const cancelPinChange = () => {
    setError("");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setStep("view");
  };

  const handleDigit = (digit: string) => {
    setError("");
    if (loading) return;
    if (step === "current" && currentPin.length < 6) setCurrentPin(currentPin + digit);
    else if (step === "new" && newPin.length < 6) setNewPin(newPin + digit);
    else if (step === "confirm" && confirmPin.length < 6) setConfirmPin(confirmPin + digit);
  };

  const handleDelete = () => {
    if (step === "current") setCurrentPin(currentPin.slice(0, -1));
    else if (step === "new") setNewPin(newPin.slice(0, -1));
    else if (step === "confirm") setConfirmPin(confirmPin.slice(0, -1));
  };

  // Verifieer de oude PIN zodra 6 cijfers zijn ingevoerd.
  useEffect(() => {
    const verify = async () => {
      if (step !== "current" || currentPin.length !== 6) return;
      setLoading(true);
      const match = await bcrypt.compare(currentPin, pinHash);
      setLoading(false);
      if (!match) {
        setError("Huidige PIN is onjuist.");
        setCurrentPin("");
        return;
      }
      setStep("new");
    };
    verify();
  }, [currentPin, step, pinHash]);

  // Ga van nieuwe PIN naar bevestiging.
  useEffect(() => {
    if (step === "new" && newPin.length === 6) {
      setStep("confirm");
    }
  }, [newPin, step]);

  // Bevestig en sla op zodra de herhaling compleet is.
  useEffect(() => {
    const save = async () => {
      if (step !== "confirm" || confirmPin.length !== 6) return;
      if (newPin !== confirmPin) {
        setError("PINs komen niet overeen. Probeer opnieuw.");
        setNewPin("");
        setConfirmPin("");
        setStep("new");
        return;
      }

      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const hash = await bcrypt.hash(newPin, 10);
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ pin_hash: hash })
        .eq("user_id", userData.user!.id);
      setLoading(false);

      if (updateError) {
        setError("Er ging iets mis. Probeer opnieuw.");
        setNewPin("");
        setConfirmPin("");
        setStep("new");
        return;
      }

      setPinHash(hash);
      setStep("done");
    };
    save();
  }, [confirmPin, newPin, step]);

  if (!user) return null;

  const activePin =
    step === "current" ? currentPin : step === "new" ? newPin : confirmPin;

  const stepTitle =
    step === "current"
      ? "Voer je huidige PIN in"
      : step === "new"
      ? "Kies je nieuwe PIN"
      : "Bevestig je nieuwe PIN";

  const isPinStep = step === "current" || step === "new" || step === "confirm";

  return (
    <main className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "var(--neutral-100)" }}>
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() =>
              isPinStep ? cancelPinChange() : (window.location.href = "/dashboard")
            }
            className="text-2xl mr-3"
            style={{ color: "var(--neutral-600)" }}>
            ←
          </button>
          <h1 className="text-xl font-bold"
            style={{ color: "var(--neutral-900)" }}>
            Profiel
          </h1>
        </div>

        {/* PIN-wijzig-flow */}
        {isPinStep ? (
          <div className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "white" }}>
            <h2 className="text-lg font-bold mb-2"
              style={{ color: "var(--brand-green)" }}>
              {stepTitle}
            </h2>
            <p className="text-sm mb-8"
              style={{ color: "var(--neutral-600)" }}>
              6-cijferige PIN
            </p>

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

            {error && <p className="text-sm mb-4 text-red-500">{error}</p>}

            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num}
                  onClick={() => handleDigit(String(num))}
                  disabled={loading}
                  className="text-2xl font-semibold py-4 rounded-2xl"
                  style={{ backgroundColor: "var(--neutral-100)",
                           color: "var(--neutral-900)" }}>
                  {num}
                </button>
              ))}
              <div></div>
              <button
                onClick={() => handleDigit("0")}
                disabled={loading}
                className="text-2xl font-semibold py-4 rounded-2xl"
                style={{ backgroundColor: "var(--neutral-100)",
                         color: "var(--neutral-900)" }}>
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xl py-4 rounded-2xl"
                style={{ backgroundColor: "var(--neutral-100)",
                         color: "var(--neutral-600)" }}>
                ⌫
              </button>
            </div>

            <button
              onClick={cancelPinChange}
              className="text-sm mt-6"
              style={{ color: "var(--neutral-600)" }}>
              Annuleren
            </button>
          </div>
        ) : (
          <>
            {/* Gebruikersinfo */}
            <div className="rounded-2xl p-6 mb-6"
              style={{ backgroundColor: "white" }}>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ backgroundColor: "var(--brand-light)",
                           color: "var(--brand-green)" }}>
                  {(fullName || email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate"
                    style={{ color: "var(--neutral-900)" }}>
                    {fullName || "Naamloos"}
                  </p>
                  <p className="text-sm truncate"
                    style={{ color: "var(--neutral-600)" }}>
                    {email}
                  </p>
                </div>
              </div>
            </div>

            {/* Beveiliging */}
            <div className="rounded-2xl p-2 mb-6"
              style={{ backgroundColor: "white" }}>
              <button
                onClick={startPinChange}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ color: "var(--neutral-900)" }}>
                <span className="font-medium">PIN wijzigen</span>
                <span style={{ color: "var(--neutral-400)" }}>→</span>
              </button>
            </div>

            {step === "done" && (
              <p className="text-sm mb-6 text-center"
                style={{ color: "var(--brand-green)" }}>
                Je PIN is bijgewerkt.
              </p>
            )}

            {/* Uitloggen */}
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl font-medium"
              style={{ backgroundColor: "var(--brand-light)",
                       color: "var(--brand-green)" }}>
              Uitloggen
            </button>
          </>
        )}

      </div>
    </main>
  );
}
