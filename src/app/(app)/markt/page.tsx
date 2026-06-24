"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Back, Succ, PageTitle, card } from "../_components/kit";
import { BT, f$, SP } from "@/lib/ui";
import { MARKETPLACE_ITEMS } from "@/lib/demo";

export default function MarktPage() {
  const { balance, setBalance, addTx, noti } = useDemo();
  const [item, setItem] = useState<(typeof MARKETPLACE_ITEMS)[number] | null>(null);
  const [ok, setOk] = useState(false);

  if (ok && item)
    return (
      <div>
        <PageTitle>🛒 Marktplaats</PageTitle>
        <Succ title="Gekocht!" extra={<div style={{ fontSize: 14, opacity: 0.5, marginTop: 6 }}>{item.title}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle>🛒 Marktplaats</PageTitle>
      {!item ? (
        MARKETPLACE_ITEMS.map((it) => (
          <div key={it.id} onClick={() => setItem(it)} style={{ background: "rgba(255,255,255,.05)", borderRadius: 14, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{it.img}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{it.title}</div><div style={{ fontSize: 10, opacity: 0.4 }}>{it.seller} · {it.cat}</div></div>
            <div style={{ fontSize: 14, fontWeight: 800, color: SP.gold }}>{f$(it.price)}</div>
          </div>
        ))
      ) : (
        <div>
          <Back onClick={() => setItem(null)} />
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>{item.img}</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{item.title}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: SP.gold, marginTop: 8 }}>{f$(item.price)}</div>
            <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Verkoper: {item.seller}</div>
            <button
              onClick={() => {
                if (item.price > balance) return noti("Onvoldoende saldo", "err");
                setBalance((b) => b - item.price);
                addTx("market", `Koop: ${item.title}`, -item.price);
                setOk(true);
                noti("Gekocht!");
              }}
              style={{ ...BT("#a855f7"), marginTop: 16 }}
            >
              Kopen & betalen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
