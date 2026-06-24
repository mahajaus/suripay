"use client";

import { useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { Opt, Back, Succ, PageTitle, card } from "../_components/kit";
import { IS, BT, f$ } from "@/lib/ui";
import { BILLS } from "@/lib/demo";

export default function RekeningenPage() {
  const { balance, setBalance, setCashback, addTx, noti } = useDemo();
  const [sub, setSub] = useState<string | null>(null);
  const [acct, setAcct] = useState("");
  const [amt, setAmt] = useState("");
  const [ok, setOk] = useState(false);
  const [last, setLast] = useState(0);

  const bill = BILLS.find((b) => b.id === sub);

  const reset = () => {
    setSub(null);
    setAcct("");
    setAmt("");
    setOk(false);
  };

  if (ok && bill)
    return (
      <div>
        <PageTitle>🧾 Rekeningen</PageTitle>
        <Succ title={`${bill.n} betaald!`} extra={<div style={{ fontSize: 24, fontWeight: 800 }}>{f$(last)}</div>} />
      </div>
    );

  return (
    <div>
      <PageTitle sub="Stroom, water & beltegoed">🧾 Rekeningen</PageTitle>

      {!sub ? (
        <Opt items={BILLS.map((b) => ({ id: b.id, ic: b.ic, l: b.n, d: b.ph, c: b.c, onClick: () => setSub(b.id) }))} />
      ) : (
        bill && (
          <div>
            <Back onClick={reset} />
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{bill.ic}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{bill.n}</span>
              </div>
              <input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder={bill.ph} style={{ ...IS, marginBottom: 10 }} />
              <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Bedrag (SRD)" style={{ ...IS, marginBottom: 14 }} />
              <button
                onClick={() => {
                  const a = parseFloat(amt);
                  if (!a || a > balance) return noti("Onvoldoende saldo", "err");
                  setBalance((b) => b - a);
                  addTx("bill", bill.n, -a);
                  const cb = a * 0.02;
                  setCashback((c) => c + cb);
                  setLast(a);
                  setOk(true);
                  noti(`${bill.n} betaald! +${f$(cb)} cashback`);
                }}
                style={BT(bill.c)}
              >
                Betalen
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
