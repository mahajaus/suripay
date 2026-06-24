"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { SP, IS } from "@/lib/ui";

export default function QrPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"ontvang" | "scan">("ontvang");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setFullName(user.user_metadata?.full_name ?? "");
      }
      setLoading(false);
    });
  }, []);

  // Camera-scanner alleen actief op het scan-tabblad.
  useEffect(() => {
    if (tab !== "scan" || loading) return;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    let active = true;

    const onSuccess = (decoded: string) => {
      if (!active) return;
      if (!decoded.startsWith("suripay:pay")) {
        setScanError("Dit is geen geldige SuriPay QR-code.");
        return;
      }
      active = false;
      const q = new URLSearchParams(decoded.split("?")[1] || "");
      const to = q.get("to");
      const amt = q.get("amount");
      if (!to) {
        setScanError("QR-code mist ontvanger.");
        active = true;
        return;
      }
      const go = () => {
        let url = `/versturen?to=${encodeURIComponent(to)}`;
        if (amt) url += `&amount=${encodeURIComponent(amt)}`;
        router.push(url);
      };
      if (scanner.isScanning) scanner.stop().catch(() => {}).finally(go);
      else go();
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        onSuccess,
        undefined
      )
      .catch(() =>
        setScanError("Kan camera niet openen. Geef toestemming en probeer opnieuw.")
      );

    return () => {
      active = false;
      if (scanner.isScanning) {
        scanner.stop().catch(() => {}).then(() => scanner.clear()).catch(() => {});
      } else {
        try {
          scanner.clear();
        } catch {
          // al opgeruimd
        }
      }
    };
  }, [tab, loading, router]);

  if (loading)
    return <div style={{ paddingTop: 40, textAlign: "center", opacity: 0.4 }}>Laden…</div>;

  const parsed = parseFloat(amount.replace(",", "."));
  const hasAmount = !isNaN(parsed) && parsed > 0;
  const qrValue = hasAmount
    ? `suripay:pay?to=${encodeURIComponent(email)}&amount=${parsed.toFixed(2)}`
    : `suripay:pay?to=${encodeURIComponent(email)}`;

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,.07)",
    borderRadius: 16,
    padding: 22,
    border: "1px solid rgba(255,255,255,.08)",
  };

  return (
    <div style={{ paddingTop: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        📱 QR Code
      </h2>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,.06)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {(["ontvang", "scan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setScanError("");
              setTab(t);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: tab === t ? SP.gold : "transparent",
              color: tab === t ? SP.ink : "rgba(255,255,255,.55)",
            }}
          >
            {t === "ontvang" ? "Mijn QR" : "Scan & Betaal"}
          </button>
        ))}
      </div>

      {tab === "ontvang" ? (
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 2 }}>
            Laat iemand deze code scannen om jou te betalen
          </p>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
            {fullName}
          </p>
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              display: "inline-block",
              marginBottom: 14,
            }}
          >
            <QRCodeCanvas value={qrValue} size={200} fgColor={SP.bgFrom} level="M" />
          </div>
          {hasAmount && (
            <p style={{ fontSize: 15, fontWeight: 800, color: SP.gold, marginBottom: 12 }}>
              Vraag: {parsed.toFixed(2)} SRD
            </p>
          )}
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Bedrag vragen (optioneel)"
            style={{ ...IS, marginBottom: 8 }}
          />
          <p style={{ fontSize: 11, opacity: 0.4 }}>{email}</p>
        </div>
      ) : (
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}>
            Richt je camera op een SuriPay QR-code
          </p>
          <div
            id="qr-reader"
            style={{
              width: "100%",
              borderRadius: 12,
              overflow: "hidden",
              minHeight: 260,
              background: "rgba(255,255,255,.05)",
            }}
          />
          {scanError && (
            <p style={{ color: SP.red, fontSize: 13, marginTop: 14 }}>{scanError}</p>
          )}
        </div>
      )}
    </div>
  );
}
