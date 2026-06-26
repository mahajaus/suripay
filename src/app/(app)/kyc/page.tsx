"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SP, f$ } from "@/lib/ui";

type Tier = {
  name: string;
  display_name: string;
  max_balance: number;
  annual_receive_limit: number;
  required_kyc: string;
  sort_order: number;
};

// Leesbare omschrijving van de KYC-eisen per tier.
const KYC_LABEL: Record<string, string> = {
  phone: "Telefoonnummer",
  phone_email_id: "Telefoon + e-mail + ID",
  phone_email_id_passport: "Telefoon + e-mail + ID + paspoort",
};

export default function KycPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [current, setCurrent] = useState<string>("");
  const [received, setReceived] = useState(0);
  const [sub, setSub] = useState<{
    status: string;
    requested_tier: string;
    reject_reason: string | null;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: wallet }, { data: tierRows }] = await Promise.all([
        supabase
          .from("wallets")
          .select("tier, received_this_year")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("kyc_tiers")
          .select(
            "name, display_name, max_balance, annual_receive_limit, required_kyc, sort_order"
          )
          .order("sort_order"),
      ]);

      if (wallet) {
        setCurrent(wallet.tier);
        setReceived(Number(wallet.received_this_year ?? 0));
      }
      if (tierRows) setTiers(tierRows as Tier[]);

      // Laatste KYC-inzending (welke status dan ook).
      const { data: latest } = await supabase
        .from("kyc_submissions")
        .select("status, requested_tier, reject_reason")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) setSub(latest);
    };
    load();
  }, []);

  const note = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const cur = tiers.find((t) => t.name === current);
  const pct =
    cur && Number(cur.annual_receive_limit) > 0
      ? Math.min(100, (received / Number(cur.annual_receive_limit)) * 100)
      : 0;

  return (
    <div style={{ paddingTop: 12 }}>
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
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
        🪪 KYC-niveau
      </h2>
      <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>
        Je limieten hangen af van je verificatieniveau
      </p>

      {/* LOPENDE VERIFICATIE */}
      {sub?.status === "pending" && (
        <div
          style={{
            background: "rgba(230,184,0,.12)",
            border: "1px solid rgba(230,184,0,.25)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🕓</span>
          <div style={{ fontSize: 12 }}>
            <b style={{ color: SP.gold }}>Verificatie in behandeling</b>
            <div style={{ opacity: 0.6 }}>
              Aanvraag voor niveau {sub.requested_tier} wordt beoordeeld.
            </div>
          </div>
        </div>
      )}

      {/* AFGEWEZEN VERIFICATIE */}
      {sub?.status === "rejected" && (
        <div
          style={{
            background: "rgba(231,76,60,.1)",
            border: "1px solid rgba(231,76,60,.25)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>❌</span>
          <div style={{ fontSize: 12 }}>
            <b style={{ color: SP.red }}>Verificatie afgewezen</b>
            <div style={{ opacity: 0.7, marginTop: 2 }}>
              {sub.reject_reason || "Neem contact op voor meer informatie."}
            </div>
            <div style={{ opacity: 0.5, marginTop: 4 }}>
              Je kunt het opnieuw proberen via de knop hieronder.
            </div>
          </div>
        </div>
      )}

      {/* HUIDIGE TIER */}
      {cur && (
        <div
          style={{
            background:
              "linear-gradient(135deg,rgba(230,184,0,.15),rgba(230,184,0,.04))",
            borderRadius: 18,
            padding: 20,
            border: "1px solid rgba(230,184,0,.2)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: SP.gold }}>
              {cur.display_name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                background: `${SP.gold}25`,
                color: SP.gold,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              {cur.name}
            </span>
          </div>

          <Row label="Max saldo" value={f$(Number(cur.max_balance))} />
          <Row
            label="Jaarlijkse ontvangstlimiet"
            value={f$(Number(cur.annual_receive_limit))}
          />
          <Row label="Al ontvangen dit jaar" value={f$(received)} />

          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: "rgba(0,0,0,.25)",
              overflow: "hidden",
              marginTop: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: SP.gold,
                borderRadius: 6,
              }}
            />
          </div>
          <p style={{ fontSize: 10, opacity: 0.4, marginTop: 6 }}>
            Nog {f$(Math.max(0, Number(cur.annual_receive_limit) - received))} te
            ontvangen dit jaar
          </p>
        </div>
      )}

      {/* TIER-LADDER */}
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        Alle niveaus
      </p>
      {tiers.map((t) => {
        const active = t.name === current;
        return (
          <div
            key={t.name}
            style={{
              background: active ? "rgba(37,211,102,.1)" : "rgba(255,255,255,.05)",
              border: `1px solid ${
                active ? "rgba(37,211,102,.3)" : "rgba(255,255,255,.08)"
              }`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {t.display_name}{" "}
                  {active && (
                    <span style={{ color: SP.green, fontSize: 11 }}>● huidig</span>
                  )}
                </div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>
                  Nodig: {KYC_LABEL[t.required_kyc] || t.required_kyc}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: SP.gold }}>
                  {f$(Number(t.max_balance))}
                </div>
                <div style={{ fontSize: 9, opacity: 0.4 }}>max saldo</div>
              </div>
            </div>
            {!active && t.sort_order > (cur?.sort_order ?? 0) && (
              <button
                onClick={() =>
                  sub?.status === "pending"
                    ? note("Er loopt al een verificatie")
                    : router.push(`/kyc/verifieren?tier=${t.name}`)
                }
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${SP.gold}`,
                  background: `${SP.gold}15`,
                  color: SP.gold,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🪪 Verifieer voor {t.display_name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        marginBottom: 6,
      }}
    >
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
