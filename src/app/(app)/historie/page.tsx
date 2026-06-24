"use client";

import { useDemo } from "../_components/DemoProvider";
import { PageTitle } from "../_components/kit";
import { f$, fD, SP } from "@/lib/ui";
import { TXI } from "@/lib/demo";

export default function HistoriePage() {
  const { txs } = useDemo();
  return (
    <div>
      <PageTitle>📋 Alle transacties</PageTitle>
      {txs.length === 0 ? (
        <p style={{ opacity: 0.4, fontSize: 13, textAlign: "center", padding: 28 }}>
          Nog geen transacties
        </p>
      ) : (
        txs.map((tx) => (
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
                  background: tx.a > 0 ? "rgba(37,211,102,.12)" : "rgba(231,76,60,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                {TXI[tx.ty] || "•"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.d}</div>
                <div style={{ fontSize: 10, opacity: 0.3 }}>{fD(tx.dt)}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tx.a > 0 ? SP.green : SP.red }}>
              {tx.a > 0 ? "+" : ""}
              {f$(tx.a)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
