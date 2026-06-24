"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "../_components/DemoProvider";
import { f$, SP } from "@/lib/ui";
import { SP_AGENTS, SP_VOUCHERS, SURIBET } from "@/lib/demo";

type Msg = { id: string; f: "s" | "u"; t: string; time: string; tp?: "r" };

const fT = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

export default function WhatsappPage() {
  const { balance, savings, goldGrams, txs, setBalance, addTx, noti } = useDemo();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "1",
      f: "s",
      t: "Welkom bij SuriPay! 🇸🇷\nStuur HELP voor opties.",
      time: "08:00",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const bot = (t: string, tp?: "r") =>
    setMsgs((p) => [
      ...p,
      { id: `${Date.now()}-${Math.random()}`, f: "s", t, time: fT(), tp },
    ]);

  const send = () => {
    if (!input.trim()) return;
    const i = input.trim();
    setMsgs((p) => [...p, { id: `${Date.now()}`, f: "u", t: i, time: fT() }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const up = i.toUpperCase();
      const c = i.toLowerCase().replace(/[^a-z]/g, "");

      if (up.startsWith("SP-")) {
        const v = SP_VOUCHERS[up];
        if (v) {
          const ag = SP_AGENTS.find((a) => a.id === v.agent);
          setBalance((b) => b + v.a);
          addTx("agent", `Agent: ${ag?.n || "SuriPay"}`, v.a);
          bot(`🏪 ${f$(v.a)} opgewaardeerd via ${ag?.n || "SuriPay"}`, "r");
          noti(`${f$(v.a)} opgewaardeerd!`);
        } else bot("❌ Ongeldige code.");
        return;
      }
      if (up.startsWith("SB-")) {
        const v = SURIBET[up];
        if (v) {
          setBalance((b) => b + v.a);
          addTx("suribet", `Suribet ${v.s}`, v.a);
          bot(`🎰 ${f$(v.a)} via ${v.s}`, "r");
          noti(`${f$(v.a)} via Suribet!`);
        } else bot("❌ Ongeldige code.");
        return;
      }

      const replies: Record<string, string> = {
        help: "📋 *SuriPay Commands*\n\nSALDO · AGENT · HISTORIE\nSURIBET · SPAREN · HELP",
        agent: `🏪 *Agents*\n${SP_AGENTS.slice(0, 3).map((a) => `📍 ${a.n}`).join("\n")}`,
        saldo: `💰 ${f$(balance)}\n🐷 Sparen: ${f$(savings)}\n🥇 Goud: ${goldGrams.toFixed(2)}g`,
        sparen: `🐷 ${f$(savings)} · 3,5%/jaar`,
        suribet: "🎰 Suribet-codes ook geaccepteerd!\nStuur je SB-code.",
        historie: txs.slice(0, 5).map((t, n) => `${n + 1}. ${t.a > 0 ? "+" : ""}${f$(t.a)} — ${t.d}`).join("\n") || "Nog geen transacties",
      };
      bot(replies[c] || "🤖 Typ HELP voor opties");
    }, 800);
  };

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: SP.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>SuriPay Bot</div>
          <div style={{ fontSize: 10, color: SP.green }}>● online · Typ HELP</div>
        </div>
      </div>

      <div ref={scrollRef} style={{ background: "rgba(0,0,0,.25)", borderRadius: 14, padding: 12, height: 340, overflowY: "auto", marginBottom: 10 }}>
        {msgs.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.f === "u" ? "flex-end" : "flex-start", marginBottom: 6 }}>
            <div style={{ maxWidth: "82%", padding: "8px 12px", borderRadius: m.f === "u" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.f === "u" ? "#005C4B" : "#1F2C34" }}>
              {m.tp === "r" && <div style={{ borderLeft: `2px solid ${SP.green}`, paddingLeft: 6, marginBottom: 3, fontSize: 9, color: SP.green, fontWeight: 700 }}>BEVESTIGING</div>}
              <div style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.t}</div>
              <div style={{ fontSize: 9, opacity: 0.3, textAlign: "right", marginTop: 2 }}>{m.time}</div>
            </div>
          </div>
        ))}
        {typing && <div style={{ fontSize: 12, opacity: 0.4, padding: 6 }}>●●● typend…</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Typ bericht of code…" style={{ flex: 1, padding: "11px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, color: "#fff", fontSize: 13, outline: "none" }} />
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: "50%", background: SP.green, border: "none", cursor: "pointer", color: "#fff", fontSize: 16 }}>↑</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {["HELP", "SALDO", "AGENT", "SURIBET", "SPAREN", "HISTORIE"].map((c) => (
          <button key={c} onClick={() => setInput(c)} style={{ padding: "4px 10px", borderRadius: 14, background: "rgba(37,211,102,.1)", border: "1px solid rgba(37,211,102,.2)", color: SP.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c}</button>
        ))}
      </div>
    </div>
  );
}
