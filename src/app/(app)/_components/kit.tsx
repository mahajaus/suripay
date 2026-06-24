"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { SP, BT } from "@/lib/ui";

export const card: CSSProperties = {
  background: "rgba(255,255,255,.07)",
  borderRadius: 16,
  padding: 22,
  border: "1px solid rgba(255,255,255,.08)",
};

export function PageTitle({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div style={{ paddingTop: 12, marginBottom: 14 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export function Back({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: SP.gold,
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 600,
        marginBottom: 14,
        padding: 0,
      }}
    >
      ← Terug
    </button>
  );
}

export function Succ({ title, extra }: { title: string; extra?: ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ ...card, textAlign: "center", padding: 28 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: SP.green, margin: "10px 0" }}>
        {title}
      </div>
      {extra}
      <button
        onClick={() => router.push("/home")}
        style={{ ...BT(SP.gold, SP.ink), width: "auto", padding: "12px 28px", marginTop: 18 }}
      >
        ← Home
      </button>
    </div>
  );
}

export type OptItem = {
  id: string;
  ic: string;
  l: string;
  d?: string;
  c: string;
  onClick: () => void;
};

export function Opt({ items }: { items: OptItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((o) => (
        <button
          key={o.id}
          onClick={o.onClick}
          style={{
            width: "100%",
            padding: "15px 16px",
            borderRadius: 14,
            background: `${o.c}15`,
            border: `1px solid ${o.c}30`,
            cursor: "pointer",
            color: "#fff",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: o.c,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {o.ic}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{o.l}</div>
            {o.d && <div style={{ fontSize: 11, opacity: 0.5 }}>{o.d}</div>}
          </div>
          <span style={{ opacity: 0.3 }}>›</span>
        </button>
      ))}
    </div>
  );
}
