"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { APP_BG, SP } from "@/lib/ui";
import { BETA, isDemoHidden } from "@/lib/beta";
import { DemoProvider } from "./_components/DemoProvider";
import ComingSoon from "./_components/ComingSoon";

// Volledige mockup-navigatie.
const NAV = [
  { href: "/home", ic: "🏠", l: "Home" },
  { href: "/qr", ic: "📱", l: "QR" },
  { href: "/rekeningen", ic: "💳", l: "Betalen" },
  { href: "/crypto", ic: "🪙", l: "Crypto" },
  { href: "/whatsapp", ic: "💬", l: "WhatsApp" },
];

// Beta-navigatie — alleen geldechte bestemmingen.
const BETA_NAV = [
  { href: "/home", ic: "🏠", l: "Home" },
  { href: "/versturen", ic: "↑", l: "Sturen" },
  { href: "/qr", ic: "📱", l: "QR" },
  { href: "/opwaarderen", ic: "💳", l: "Opwaarderen" },
  { href: "/opnemen", ic: "🏧", l: "Opnemen" },
];

const navItems = BETA ? BETA_NAV : NAV;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Auth-poort: alleen ingelogde gebruikers zien de app-shell.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: APP_BG,
          fontFamily: "system-ui,sans-serif",
          color: "rgba(255,255,255,.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        Laden…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: APP_BG,
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pathname !== "/home" && (
            <Link
              href="/home"
              aria-label="Terug naar home"
              style={{
                fontSize: 22,
                color: SP.gold,
                textDecoration: "none",
                lineHeight: 1,
              }}
            >
              ←
            </Link>
          )}
          <div>
            <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: 2 }}>
              SURINAME DIGITAL WALLET
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: SP.gold }}>
              SuriPay
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/profiel"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `${SP.gold}25`,
              border: `1px solid ${SP.gold}50`,
              color: SP.gold,
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            👤
          </Link>
          {!BETA && (
            <Link
              href="/whatsapp"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: SP.green,
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              💬
            </Link>
          )}
        </div>
      </div>

      {/* PAGINA-INHOUD (demo-routes verborgen in beta, ook bij directe URL) */}
      <DemoProvider>
        <div style={{ padding: "10px 20px 110px" }}>
          {isDemoHidden(pathname) ? <ComingSoon /> : children}
        </div>
      </DemoProvider>

      {/* ONDERSTE NAVIGATIE */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "rgba(11,61,46,.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0 20px",
          zIndex: 100,
        }}
      >
        {navItems.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: active ? SP.gold : "rgba(255,255,255,.35)",
                padding: "4px 8px",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{n.ic}</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{n.l}</span>
              {active && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: SP.gold,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
