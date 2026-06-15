"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, QrCode, ScanLine } from "lucide-react";

export default function BetalenPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"ontvang" | "scan">("ontvang");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanError, setScanError] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email ?? "");
      setFullName(user.user_metadata?.full_name ?? "");
      setLoading(false);
    };
    load();
  }, [router]);

  // Start/stop de camera-scanner wanneer de "scan" tab actief is.
  useEffect(() => {
    if (tab !== "scan" || loading) return;

    setScanError("");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    let active = true;

    const onScanSuccess = (decodedText: string) => {
      // Verwerk maar één keer.
      if (!active) return;
      active = false;

      // Verwacht formaat: suripay:pay?to=EMAIL&amount=BEDRAG
      if (!decodedText.startsWith("suripay:pay")) {
        setScanError("Dit is geen geldige SuriPay QR-code.");
        active = true;
        return;
      }

      const queryString = decodedText.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const to = params.get("to");
      const scannedAmount = params.get("amount");

      if (!to) {
        setScanError("QR-code mist ontvanger.");
        active = true;
        return;
      }

      // Stop de camera en ga naar de Sturen-flow.
      const goToSturen = () => {
        let url = `/sturen?to=${encodeURIComponent(to)}`;
        if (scannedAmount) url += `&amount=${encodeURIComponent(scannedAmount)}`;
        router.push(url);
      };

      if (scanner.isScanning) {
        scanner.stop().catch(() => {}).finally(goToSturen);
      } else {
        goToSturen();
      }
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        onScanSuccess,
        undefined
      )
      .catch((err) => {
        console.error(err);
        setScanError(
          "Kan camera niet openen. Geef toestemming en probeer opnieuw."
        );
      });

    // Opruimen als je van tab wisselt of de pagina verlaat.
    return () => {
      active = false;
      if (scanner.isScanning) {
        scanner
          .stop()
          .catch(() => {})
          .then(() => scanner.clear())
          .catch(() => {});
      } else {
        try {
          scanner.clear();
        } catch {
          // scanner is al opgeruimd
        }
      }
    };
  }, [tab, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--neutral-400)" }}>Laden...</p>
      </main>
    );
  }

  // Bouw de QR-waarde op. Als er een geldig bedrag is, voegen we dat toe.
  const parsedAmount = parseFloat(amount.replace(",", "."));
  const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const qrValue = hasAmount
    ? `suripay:pay?to=${encodeURIComponent(email)}&amount=${parsedAmount.toFixed(2)}`
    : `suripay:pay?to=${encodeURIComponent(email)}`;

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 mb-6"
        style={{ color: "var(--neutral-600)" }}
      >
        <ArrowLeft size={20} />
        <span className="font-semibold text-lg">Betalen</span>
      </button>

      {/* Tabs */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ backgroundColor: "var(--neutral-100)" }}
      >
        <button
          onClick={() => setTab("ontvang")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition"
          style={{
            backgroundColor: tab === "ontvang" ? "white" : "transparent",
            color: tab === "ontvang" ? "var(--brand-green)" : "var(--neutral-600)",
            boxShadow: tab === "ontvang" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <QrCode size={18} />
          Mijn QR-code
        </button>
        <button
          onClick={() => setTab("scan")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition"
          style={{
            backgroundColor: tab === "scan" ? "white" : "transparent",
            color: tab === "scan" ? "var(--brand-green)" : "var(--neutral-600)",
            boxShadow: tab === "scan" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <ScanLine size={18} />
          Scan & Betaal
        </button>
      </div>

      {tab === "ontvang" ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ backgroundColor: "white", border: "1px solid var(--neutral-100)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--neutral-600)" }}>
            Laat iemand deze code scannen om jou te betalen
          </p>
          <p className="font-bold text-lg mb-6" style={{ color: "var(--neutral-900)" }}>
            {fullName}
          </p>

          <div
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: "white", border: "2px solid var(--brand-light)" }}
          >
            <QRCodeCanvas
              value={qrValue}
              size={200}
              fgColor="#00704A"
              bgColor="#ffffff"
              level="M"
            />
          </div>

          {hasAmount && (
            <p
              className="text-base font-bold mb-4"
              style={{ color: "var(--brand-green)" }}
            >
              Vraag: SRD {parsedAmount.toFixed(2)}
            </p>
          )}

          {/* Bedrag-veld */}
          <div className="w-full mb-2">
            <label
              className="block text-xs mb-1 text-left"
              style={{ color: "var(--neutral-600)" }}
            >
              Bedrag vragen (optioneel)
            </label>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--neutral-600)" }}
              >
                SRD
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--neutral-100)",
                  color: "var(--neutral-900)",
                }}
              />
              {amount && (
                <button
                  onClick={() => setAmount("")}
                  className="text-xs px-2 py-1"
                  style={{ color: "var(--neutral-400)" }}
                >
                  Wissen
                </button>
              )}
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: "var(--neutral-400)" }}>
            {email}
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 flex flex-col items-center text-center"
          style={{ backgroundColor: "white", border: "1px solid var(--neutral-100)" }}
        >
          <p className="text-sm mb-4" style={{ color: "var(--neutral-600)" }}>
            Richt je camera op een SuriPay QR-code
          </p>

          {/* Hier rendert de camera-feed */}
          <div
            id="qr-reader"
            className="w-full rounded-xl overflow-hidden"
            style={{ minHeight: "260px", backgroundColor: "var(--neutral-100)" }}
          />

          {scanError && (
            <p className="text-sm mt-4 text-red-500">{scanError}</p>
          )}

          <p className="text-xs mt-4" style={{ color: "var(--neutral-400)" }}>
            De camera opent automatisch. Geef toestemming als de browser erom
            vraagt.
          </p>
        </div>
      )}
    </main>
  );
}