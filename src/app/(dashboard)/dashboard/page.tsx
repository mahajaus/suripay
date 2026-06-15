"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setUser(userData.user);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", userData.user.id)
        .single();

      if (wallet) {
        setBalance(Number(wallet.balance).toFixed(2));

        const { data: txs } = await supabase.rpc("get_my_transactions", {
          p_wallet_id: wallet.id,
        });

        if (txs) setTransactions(txs);
      }
    };
    getData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <main className="min-h-screen px-4 py-8"
      style={{ backgroundColor: "var(--neutral-100)" }}>
      <div className="max-w-sm mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: "var(--neutral-600)" }}>
              Welkom terug
            </p>
            <h1 className="text-xl font-bold"
              style={{ color: "var(--neutral-900)" }}>
              {user.user_metadata?.full_name || user.email}
            </h1>
          </div>
          <button onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-xl"
            style={{ backgroundColor: "var(--brand-light)",
                     color: "var(--brand-green)" }}>
            Uitloggen
          </button>
        </div>

        <div className="rounded-2xl p-6 mb-6 text-white"
          style={{ backgroundColor: "var(--brand-green)" }}>
          <p className="text-sm opacity-80 mb-1">Beschikbaar saldo</p>
          <h2 className="text-4xl font-bold mb-1">SRD {balance}</h2>
          <p className="text-sm opacity-70">SuriPay Wallet</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Sturen", icon: "↑", href: "/sturen" },
            { label: "Ontvangen", icon: "↓", href: "/ontvangen" },
            { label: "Betalen", icon: "⚡", href: "/betalen" },
          ].map((action) => (
            <div key={action.label}
              onClick={() => window.location.href = action.href}
              className="rounded-2xl p-4 text-center cursor-pointer"
              style={{ backgroundColor: "white" }}>
              <div className="text-2xl mb-1">{action.icon}</div>
              <p className="text-xs font-medium"
                style={{ color: "var(--neutral-800)" }}>
                {action.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5"
          style={{ backgroundColor: "white" }}>
          <h3 className="font-semibold mb-4"
            style={{ color: "var(--neutral-900)" }}>
            Recente transacties
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8"
              style={{ color: "var(--neutral-400)" }}>
              <p className="text-sm">Nog geen transacties</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--neutral-100)" }}>
                  <div>
                    <p className="text-sm font-medium"
                      style={{ color: "var(--neutral-900)" }}>
                      {tx.direction === "out" ? "Naar " : "Van "}
                      {tx.other_party}
                    </p>
                    {tx.description && (
                      <p className="text-xs"
                        style={{ color: "var(--neutral-600)" }}>
                        {tx.description}
                      </p>
                    )}
                    <p className="text-xs"
                      style={{ color: "var(--neutral-400)" }}>
                      {new Date(tx.created_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap"
                    style={{ color: tx.direction === "out"
                      ? "#EF4444"
                      : "var(--brand-green)" }}>
                    {tx.direction === "out" ? "-" : "+"}
                    SRD {Number(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}