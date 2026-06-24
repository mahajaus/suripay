"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT } from "@/lib/ui";
import { CONTACTS } from "@/lib/demo";

export default function AanvragenPage() {
  const { noti } = useDemo();
  const [contact, setContact] = useState<(typeof CONTACTS)[number] | null>(null);
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);

  if (ok)
    return (
      <div>
        <PageTitle>📩 Geld aanvragen</PageTitle>
        <Succ title="Verzoek verstuurd!" extra={<div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>via WhatsApp aan {contact?.n}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle>📩 Geld aanvragen</PageTitle>
      {!contact ? (
        CONTACTS.map((c) => (
          <button key={c.id} onClick={() => setContact(c)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 12, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,.06)", cursor: "pointer", color: "#fff" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E6B800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0B3D2E" }}>{c.av}</div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{c.n}</span>
          </button>
        ))
      ) : (
        <div>
          <Back onClick={() => setContact(null)} />
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Verzoek aan {contact.n}</div>
            <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
            <button
              onClick={() => {
                if (!parseFloat(amt)) return noti("Voer een bedrag in", "err");
                setOk(true);
                noti("Verstuurd!");
              }}
              style={BT("#E6B800", "#0B3D2E")}
            >
              Sturen via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
