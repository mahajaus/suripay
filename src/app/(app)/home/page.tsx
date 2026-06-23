"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { f$, fD, SP } from "@/lib/ui";

// Iconen per transactietype.
const TXI: Record<string, string> = {
  topup: "💳",
  send: "↑",
  receive: "↓",
  bill: "🧾",
  gold: "🥇",
  crypto: "🪙",
  qr: "📱",
};

// Demo sub-saldi — nog geen backend (worden later echt gemaakt).
const DEMO = { savings: 450, cashback: 47.5, goldGrams: 3.25 };
const GOLD_USD_PER_GRAM = 85.5;
const USD_RATE = 0.028;

type Tx = { id: string; a: number; d: string; ty: string; dt: string };

// Het actie-rooster (4×4) — exact zoals de mockup. `href` = al gebouwd scherm;
// de rest toont voorlopig een "binnenkort" melding.
const ACTIONS: { ic: string; l: string; c: string; href?: string }[] = [
  { ic: "💳", l: "Opwaarderen", c: "#25D366" },
  { ic: "↑", l: "Versturen", c: "#25D366" },
  { ic: "📩", l: "Aanvragen", c: "#E6B800" },
  { ic: "📱", l: "QR", c: "#E6B800", href: "/qr" },
  { ic: "🧾", l: "Rekeningen", c: "#3b82f6", href: "/rekeningen" },
  { ic: "🏧", l: "Opnemen", c: "#a855f7" },
  { ic: "🥇", l: "CBvS Goud", c: "#E6B800" },
  { ic: "🪙", l: "Crypto", c: "#F7931A", href: "/crypto" },
  { ic: "🐷", l: "Sparen", c: "#10B981" },
  { ic: "🏦", l: "Leningen", c: "#0066B3" },
  { ic: "🛡️", l: "Verzekering", c: "#E11D48" },
  { ic: "🎁", l: "Cashback", c: "#F59E0B" },
  { ic: "🛒", l: "Marktplaats", c: "#a855f7" },
  { ic: "🏛️", l: "Overheid", c: "#1B3A5C" },
  { ic: "🌍", l: "Diaspora", c: "#3b82f6" },
  { ic: "🌾", l: "Landbouw", c: "#10B981" },
];

export default function HomePage() {
  const router = useRouter();
  const [bal, setBal] = useState(4735.5);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // TODO: niet-ingelogd → demo-saldo tonen. Voor de definitieve app hier
      // doorsturen naar /login zodra de auth-flow op de nieuwe shell zit.
      if (!user) return;

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet) return;
      setBal(Number(wallet.balance));

      const { data: t } = await supabase.rpc("get_my_transactions", {
        p_wallet_id: wallet.id,
      });
      if (t) {
        setTxs(
          t.map(
            (x: {
              id: string;
              direction: string;
              other_party: string;
              amount: number;
              description: string | null;
              created_at: string;
            }) => ({
              id: x.id,
              a: x.direction === "out" ? -Number(x.amount) : Number(x.amount),
              d: x.description || x.other_party,
              ty: x.direction === "out" ? "send" : "receive",
              dt: x.created_at,
            })
          )
        );
      }
    };
    load();
  }, []);

  const note = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const goldPriceSRD = GOLD_USD_PER_GRAM / USD_RATE;
  const goldValueSRD = DEMO.goldGrams * goldPriceSRD;

  return (
    <div>
      {/* TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background: SP.gold,
            color: SP.ink,
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,.3)",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      {/* SALDO-KAART */}
      <div
        style={{
          background:
            "linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04))",
          borderRadius: 20,
          padding: 20,
          marginTop: 12,
          border: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.4 }}>BESCHIKBAAR SALDO</span>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>SRD </span>
          {bal.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 6,
            fontSize: 10,
            opacity: 0.4,
            flexWrap: "wrap",
          }}
        >
          <span>≈ USD {(bal * USD_RATE).toFixed(2)}</span>
          <span>🐷 {f$(DEMO.savings)}</span>
          <span>🥇 {DEMO.goldGrams.toFixed(2)}g</span>
          <span>🎁 {f$(DEMO.cashback)}</span>
        </div>
      </div>

      {/* GOUD-KAART */}
      <div
        onClick={() => note("CBvS Goud — binnenkort beschikbaar")}
        style={{
          cursor: "pointer",
          background:
            "linear-gradient(135deg,rgba(230,184,0,.15),rgba(230,184,0,.04))",
          borderRadius: 14,
          padding: "14px 18px",
          marginTop: 10,
          border: "1px solid rgba(230,184,0,.2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🥇</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: SP.gold }}>
            CBvS Digitaal Goud
          </div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>
            {DEMO.goldGrams.toFixed(2)} gram · Centrale Bank van Suriname
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: SP.gold }}>
            {f$(goldValueSRD)}
          </div>
          <div style={{ fontSize: 9, opacity: 0.4 }}>5% rente/jaar</div>
        </div>
      </div>

      {/* ACTIE-ROOSTER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 8,
          marginTop: 14,
        }}
      >
        {ACTIONS.map((a) => (
          <button
            key={a.l}
            onClick={() =>
              a.href
                ? router.push(a.href)
                : note(`${a.l} — binnenkort beschikbaar`)
            }
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 14,
              padding: "12px 4px",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 18 }}>{a.ic}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: a.c,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {a.l}
            </span>
          </button>
        ))}
      </div>

      {/* RECENTE TRANSACTIES */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Recente transacties
          </span>
          <button
            onClick={() => note("Historie — binnenkort beschikbaar")}
            style={{
              background: "none",
              border: "none",
              color: SP.gold,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Alles →
          </button>
        </div>

        {txs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "28px 0",
              opacity: 0.4,
              fontSize: 13,
            }}
          >
            Nog geen transacties
          </div>
        ) : (
          txs.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background:
                      tx.a > 0
                        ? "rgba(37,211,102,.12)"
                        : "rgba(231,76,60,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  {TXI[tx.ty] || "•"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.d}</div>
                  <div style={{ fontSize: 10, opacity: 0.3 }}>{fD(tx.dt)}</div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tx.a > 0 ? SP.green : SP.red,
                }}
              >
                {tx.a > 0 ? "+" : ""}
                {f$(tx.a)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
