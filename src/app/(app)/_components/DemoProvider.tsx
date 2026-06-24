"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { SP } from "@/lib/ui";

export type Tx = { id: string | number; ty: string; d: string; a: number; dt: string };
export type CryptoBal = { usdt: number; usdc: number; dai: number };

type TxRow = {
  id: string;
  direction: string;
  other_party: string;
  amount: number;
  description: string | null;
  created_at: string;
};

type Ctx = {
  ready: boolean;
  email: string;
  fullName: string;
  balance: number;
  savings: number;
  cashback: number;
  goldGrams: number;
  cryptoB: CryptoBal;
  insurances: string[];
  txs: Tx[];
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setSavings: React.Dispatch<React.SetStateAction<number>>;
  setCashback: React.Dispatch<React.SetStateAction<number>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setCrypto: React.Dispatch<React.SetStateAction<CryptoBal>>;
  setInsurances: React.Dispatch<React.SetStateAction<string[]>>;
  addTx: (ty: string, d: string, a: number) => void;
  noti: (m: string, t?: "ok" | "err") => void;
};

const C = createContext<Ctx | null>(null);

export const useDemo = () => {
  const v = useContext(C);
  if (!v) throw new Error("useDemo buiten DemoProvider");
  return v;
};

// Sessie-store voor de demo-flows. Saldo + transacties worden geseed uit
// de echte Supabase-wallet; demo-acties muteren alleen deze in-memory state
// (verdwijnen bij refresh). Echte overboekingen lopen los via de server.
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [balance, setBalance] = useState(0);
  const [savings, setSavings] = useState(450);
  const [cashback, setCashback] = useState(47.5);
  const [goldGrams, setGold] = useState(3.25);
  const [cryptoB, setCrypto] = useState<CryptoBal>({ usdt: 25, usdc: 10.5, dai: 0 });
  const [insurances, setInsurances] = useState<string[]>(["health"]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [note, setNote] = useState<{ m: string; t: "ok" | "err" } | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReady(true);
        return;
      }
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single();
      if (wallet) {
        setBalance(Number(wallet.balance));
        const { data: t } = await supabase.rpc("get_my_transactions", {
          p_wallet_id: wallet.id,
        });
        if (t) {
          setTxs(
            (t as TxRow[]).map((x) => ({
              id: x.id,
              ty: x.direction === "out" ? "send" : "receive",
              d: x.description || x.other_party,
              a: x.direction === "out" ? -Number(x.amount) : Number(x.amount),
              dt: x.created_at,
            }))
          );
        }
      }
      setReady(true);
    };
    load();
  }, []);

  const addTx = useCallback(
    (ty: string, d: string, a: number) =>
      setTxs((p) => [
        { id: `${Date.now()}-${Math.random()}`, ty, d, a, dt: new Date().toISOString() },
        ...p,
      ]),
    []
  );

  const noti = useCallback((m: string, t: "ok" | "err" = "ok") => {
    setNote({ m, t });
    setTimeout(() => setNote(null), 2800);
  }, []);

  return (
    <C.Provider
      value={{
        ready,
        email,
        fullName,
        balance,
        savings,
        cashback,
        goldGrams,
        cryptoB,
        insurances,
        txs,
        setBalance,
        setSavings,
        setCashback,
        setGold,
        setCrypto,
        setInsurances,
        addTx,
        noti,
      }}
    >
      {note && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background: note.t === "ok" ? SP.green : SP.red,
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,.3)",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {note.m}
        </div>
      )}
      {children}
    </C.Provider>
  );
}
