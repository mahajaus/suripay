"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tier, setTier] = useState<any>(null);
  const [receivedThisYear, setReceivedThisYear] = useState<number>(0);

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
        .select(
          "id, balance, received_this_year, kyc_tiers ( name, display_name, max_balance, annual_receive_limit )"
        )
        .eq("user_id", userData.user.id)
        .single();

      if (wallet) {
        setBalance(Number(wallet.balance).toFixed(2));
        setReceivedThisYear(Number(wallet.received_this_year ?? 0));

        // Embedded relatie kan als object of (afhankelijk van detectie) als array terugkomen.
        const tierData = Array.isArray(wallet.kyc_tiers)
          ? wallet.kyc_tiers[0]
          : wallet.kyc_tiers;
        if (tierData) setTier(tierData);

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
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.href = "/profiel"}
              className="text-sm px-4 py-2 rounded-xl"
              style={{ backgroundColor: "var(--brand-light)",
                       color: "var(--brand-green)" }}>
              Profiel
            </button>
            <button onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-xl"
              style={{ backgroundColor: "var(--brand-light)",
                       color: "var(--brand-green)" }}>
              Uitloggen
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-6 mb-6 text-white"
          style={{ backgroundColor: "var(--brand-green)" }}>
          <p className="text-sm opacity-80 mb-1">Beschikbaar saldo</p>
          <h2 className="text-4xl font-bold mb-1">SRD {balance}</h2>
          <p className="text-sm opacity-70">SuriPay Wallet</p>
        </div>

        {tier && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold"
                style={{ color: "var(--neutral-900)" }}>
                KYC-niveau
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase"
                style={{ backgroundColor: "var(--brand-light)",
                         color: "var(--brand-green)" }}>
                {tier.name}
              </span>
            </div>

            <p className="text-sm font-medium mb-4"
              style={{ color: "var(--neutral-800)" }}>
              {tier.display_name}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--neutral-600)" }}>Max saldo</span>
                <span className="font-medium"
                  style={{ color: "var(--neutral-900)" }}>
                  SRD {Number(tier.max_balance).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--neutral-600)" }}>
                  Jaarlijkse ontvangstruimte
                </span>
                <span className="font-medium"
                  style={{ color: "var(--neutral-900)" }}>
                  SRD {Number(tier.annual_receive_limit).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--neutral-600)" }}>
                  Al ontvangen dit jaar
                </span>
                <span className="font-medium"
                  style={{ color: "var(--neutral-900)" }}>
                  SRD {receivedThisYear.toFixed(2)}
                </span>
              </div>
            </div>

            {Number(tier.annual_receive_limit) > 0 && (
              <div className="mt-4">
                <div className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--neutral-100)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (receivedThisYear / Number(tier.annual_receive_limit)) * 100
                      )}%`,
                      backgroundColor: "var(--brand-green)",
                    }} />
                </div>
                <p className="text-xs mt-1"
                  style={{ color: "var(--neutral-400)" }}>
                  Nog SRD {Math.max(
                    0,
                    Number(tier.annual_receive_limit) - receivedThisYear
                  ).toFixed(2)} te ontvangen dit jaar
                </p>
              </div>
            )}
          </div>
        )}

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
                      {new Date(tx.created_at).toLocaleString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
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