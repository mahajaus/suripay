"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_BG, SP } from "@/lib/ui";

// Onderste navigatiebalk — 5 hoofdbestemmingen, exact zoals de mockup.
const NAV = [
  { href: "/home", ic: "🏠", l: "Home" },
  { href: "/qr", ic: "📱", l: "QR" },
  { href: "/rekeningen", ic: "💳", l: "Betalen" },
  { href: "/crypto", ic: "🪙", l: "Crypto" },
  { href: "/whatsapp", ic: "💬", l: "WhatsApp" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        <div>
          <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: 2 }}>
            SURINAME DIGITAL WALLET
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: SP.gold }}>
            SuriPay
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
        </div>
      </div>

      {/* PAGINA-INHOUD */}
      <div style={{ padding: "10px 20px 110px" }}>{children}</div>

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
        {NAV.map((n) => {
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
