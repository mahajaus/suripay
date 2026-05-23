import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SCREENS = {
  LOGIN: "login",
  REGISTER: "register",
  DASHBOARD: "dashboard",
  CARD: "card",
  TOPUP: "topup",
  QR: "qr",
  KYC: "kyc",
};

// ─── Bottom Nav ────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen }) {
  const items = [
    { id: SCREENS.DASHBOARD, icon: "⊞", label: "Home" },
    { id: SCREENS.CARD, icon: "💳", label: "Kaart" },
    { id: SCREENS.TOPUP, icon: "🎫", label: "Opladen" },
    { id: SCREENS.QR, icon: "⬛", label: "QR" },
    { id: SCREENS.KYC, icon: "🪪", label: "Verificatie" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(10,22,40,0.97)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", backdropFilter: "blur(20px)",
      paddingBottom: 8, zIndex: 100,
    }}>
      {items.map(item => (
        <div key={item.id} onClick={() => setScreen(item.id)} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "10px 0",
          cursor: "pointer",
          color: screen === item.id ? "#00d4aa" : "#4a6080",
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10, marginTop: 3, fontWeight: 600 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────
function LoginScreen({ onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Onjuist e-mailadres of wachtwoord");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 50%, #0a1628 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64,
          background: "linear-gradient(135deg, #00d4aa, #0099ff)",
          borderRadius: 18, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px",
          boxShadow: "0 0 40px rgba(0,212,170,0.3)",
        }}>
          <span style={{ fontSize: 28 }}>₿</span>
        </div>
        <div style={{ color: "#00d4aa", fontSize: 28, fontWeight: 800 }}>SuriPay</div>
        <div style={{ color: "#6b8ab0", fontSize: 13, marginTop: 4 }}>Jouw internationale wallet</div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "32px 28px",
        width: "100%", maxWidth: 360,
      }}>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Welkom terug</div>
        <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 28 }}>Log in op jouw SuriPay account</div>

        {error && (
          <div style={{
            background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
            borderRadius: 10, padding: "10px 14px", color: "#ff6b6b",
            fontSize: 12, marginBottom: 16,
          }}>{error}</div>
        )}

        <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>E-MAILADRES</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="jij@email.com"
          style={{
            width: "100%", marginTop: 6, marginBottom: 16,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14,
            outline: "none", boxSizing: "border-box",
          }}
        />

        <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>WACHTWOORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", marginTop: 6, marginBottom: 24,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14,
            outline: "none", boxSizing: "border-box",
          }}
        />

        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%",
          background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #00d4aa, #0099ff)",
          border: "none", borderRadius: 14, padding: "14px",
          color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,212,170,0.3)",
        }}>
          {loading ? "Inloggen..." : "Inloggen"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, color: "#6b8ab0", fontSize: 13 }}>
          Nog geen account?{" "}
          <span onClick={onGoRegister} style={{ color: "#00d4aa", cursor: "pointer", fontWeight: 600 }}>
            Registreren
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Register Screen ───────────────────────────────────────────────────────
function RegisterScreen({ onGoLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) { setError("Vul alle velden in"); return; }
    if (password.length < 6) { setError("Wachtwoord minimaal 6 tekens"); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 50%, #0a1628 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64,
          background: "linear-gradient(135deg, #00d4aa, #0099ff)",
          borderRadius: 18, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px",
        }}>
          <span style={{ fontSize: 28 }}>₿</span>
        </div>
        <div style={{ color: "#00d4aa", fontSize: 28, fontWeight: 800 }}>SuriPay</div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "32px 28px",
        width: "100%", maxWidth: 360,
      }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ color: "#00d4aa", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Account aangemaakt!</div>
            <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 24 }}>Controleer je email om je account te bevestigen.</div>
            <button onClick={onGoLogin} style={{
              width: "100%", background: "linear-gradient(135deg, #00d4aa, #0099ff)",
              border: "none", borderRadius: 14, padding: "14px",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>Naar inloggen</button>
          </div>
        ) : (
          <>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Account aanmaken</div>
            <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 28 }}>Maak jouw SuriPay account</div>

            {error && (
              <div style={{
                background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 10, padding: "10px 14px", color: "#ff6b6b",
                fontSize: 12, marginBottom: 16,
              }}>{error}</div>
            )}

            <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>VOLLEDIGE NAAM</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jouw naam"
              style={{ width: "100%", marginTop: 6, marginBottom: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
            <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>E-MAILADRES</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jij@email.com"
              style={{ width: "100%", marginTop: 6, marginBottom: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
            <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>WACHTWOORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimaal 6 tekens"
              style={{ width: "100%", marginTop: 6, marginBottom: 24, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />

            <button onClick={handleRegister} disabled={loading} style={{
              width: "100%",
              background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #00d4aa, #0099ff)",
              border: "none", borderRadius: 14, padding: "14px",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>
              {loading ? "Account aanmaken..." : "Account aanmaken"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20, color: "#6b8ab0", fontSize: 13 }}>
              Al een account?{" "}
              <span onClick={onGoLogin} style={{ color: "#00d4aa", cursor: "pointer", fontWeight: 600 }}>Inloggen</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── KYC Status Banner ─────────────────────────────────────────────────────
function KYCBanner({ userId, setScreen }) {
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    supabase
      .from("kyc_submissions")
      .select("status")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => { if (data) setKycStatus(data.status); });
  }, [userId]);

  if (kycStatus === "approved") return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)",
      borderRadius: 14, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <div style={{ color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>Identiteit geverifieerd</div>
          <div style={{ color: "#6b8ab0", fontSize: 11 }}>Je account is volledig actief</div>
        </div>
      </div>
    </div>
  );

  if (kycStatus === "pending") return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(255,180,0,0.1)", border: "1px solid rgba(255,180,0,0.3)",
      borderRadius: 14, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⏳</span>
        <div>
          <div style={{ color: "#ffb400", fontSize: 13, fontWeight: 700 }}>Verificatie in behandeling</div>
          <div style={{ color: "#6b8ab0", fontSize: 11 }}>We controleren je documenten</div>
        </div>
      </div>
    </div>
  );

  if (kycStatus === "rejected") return (
    <div onClick={() => setScreen(SCREENS.KYC)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
      borderRadius: 14, padding: "12px 16px", marginBottom: 16, cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>❌</span>
        <div>
          <div style={{ color: "#ff6b6b", fontSize: 13, fontWeight: 700 }}>Verificatie afgekeurd</div>
          <div style={{ color: "#6b8ab0", fontSize: 11 }}>Tik om opnieuw in te dienen</div>
        </div>
      </div>
      <span style={{ color: "#ff6b6b", fontSize: 18 }}>›</span>
    </div>
  );

  // Geen KYC ingediend
  return (
    <div onClick={() => setScreen(SCREENS.KYC)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.25)",
      borderRadius: 14, padding: "12px 16px", marginBottom: 16, cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🪪</span>
        <div>
          <div style={{ color: "#ffb400", fontSize: 13, fontWeight: 700 }}>Verifieer je identiteit</div>
          <div style={{ color: "#6b8ab0", fontSize: 11 }}>Vereist voor volledige toegang</div>
        </div>
      </div>
      <span style={{ color: "#ffb400", fontSize: 18 }}>›</span>
    </div>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────
function DashboardScreen({ user, onLogout, setScreen }) {
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: prof } = await supabase
      .from("users").select("*").eq("id", user.id).single();
    const { data: txns } = await supabase
      .from("transactions").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(10);
    setProfile(prof);
    setTransactions(txns || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || "Gebruiker";
  const txIcon = (type) => type === "topup" ? "🎫" : type === "purchase" ? "🛒" : "💸";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 50%, #0a1628 100%)",
      fontFamily: "'DM Sans', sans-serif", paddingBottom: 80,
    }}>
      <div style={{ padding: "56px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#6b8ab0", fontSize: 13 }}>Goedendag,</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{name} 👋</div>
        </div>
        <button onClick={onLogout} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "6px 12px", color: "#8aa4c8",
          fontSize: 11, cursor: "pointer", fontWeight: 600,
        }}>Uitloggen</button>
      </div>

      <div style={{ padding: "0 24px 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #00d4aa 0%, #0066cc 100%)",
          borderRadius: 24, padding: "28px 24px",
          boxShadow: "0 8px 40px rgba(0,212,170,0.25)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>TOTAAL SALDO</div>
          <div style={{ color: "#fff", fontSize: 40, fontWeight: 900, letterSpacing: "-1px", margin: "8px 0" }}>
            ${loading ? "..." : (profile?.balance_usd || 0).toFixed(2)}
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            ≈ SRD {loading ? "..." : (profile?.balance_srd || 0).toFixed(2)}
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{
              background: "rgba(255,255,255,0.15)", borderRadius: 10,
              padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, display: "inline-block",
            }}>🌍 Internationaal actief</div>
          </div>
        </div>
      </div>

      {/* KYC Status Banner */}
      <div style={{ padding: "0 24px" }}>
        <KYCBanner userId={user.id} setScreen={setScreen} />
      </div>

      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { icon: "🎫", label: "Opladen", screen: SCREENS.TOPUP },
            { icon: "💳", label: "Mijn kaart", screen: SCREENS.CARD },
            { icon: "⬛", label: "QR scan", screen: SCREENS.QR },
            { icon: "🔄", label: "Vernieuwen", action: fetchData },
          ].map((action, i) => (
            <div key={i} onClick={() => action.screen ? setScreen(action.screen) : action.action()} style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "14px 8px", textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 20 }}>{action.icon}</div>
              <div style={{ color: "#8aa4c8", fontSize: 10, marginTop: 4, fontWeight: 600 }}>{action.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recente transacties</div>
        {loading ? (
          <div style={{ color: "#6b8ab0", textAlign: "center", padding: "20px 0" }}>Laden...</div>
        ) : transactions.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "24px", textAlign: "center",
            color: "#6b8ab0", fontSize: 13,
          }}>
            Nog geen transacties — laad je wallet op met een scratch kaart! 🎫
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: "14px 16px", marginBottom: 10,
            }}>
              <div style={{
                width: 42, height: 42, background: "rgba(255,255,255,0.08)",
                borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, marginRight: 14,
              }}>{txIcon(tx.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{tx.description}</div>
                <div style={{ color: "#6b8ab0", fontSize: 12 }}>
                  {new Date(tx.created_at).toLocaleDateString("nl-SR")}
                </div>
              </div>
              <div style={{ color: tx.type === "topup" ? "#00d4aa" : "#fff", fontWeight: 700, fontSize: 15 }}>
                {tx.type === "topup" ? "+" : "-"}SRD {Math.abs(tx.amount_srd).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Topup Screen ──────────────────────────────────────────────────────────
function TopupScreen({ user, onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRedeem = async () => {
    if (code.trim().length < 10) { setResult({ success: false, message: "Voer een geldige code in" }); return; }
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.rpc("redeem_scratch_card", {
      card_code: code.trim().toUpperCase(),
      user_id: user.id,
    });
    setLoading(false);
    if (error) { setResult({ success: false, message: "Fout bij verwerken. Probeer opnieuw." }); return; }
    setResult(data);
    if (data.success) { setCode(""); onSuccess(); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: "56px 24px 80px",
    }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Wallet opladen</div>
      <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 32 }}>Voer jouw scratch kaart code in</div>

      <div style={{
        background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
        borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 28,
        border: "2px dashed rgba(0,212,170,0.3)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>SuriPay Scratch Kaart</div>
        <div style={{ color: "#6b8ab0", fontSize: 13, marginTop: 4 }}>Kras de zilveren laag eraf en voer de code in</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
          {["SRD 50", "SRD 100", "SRD 250"].map((val, i) => (
            <div key={i} style={{
              background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)",
              borderRadius: 8, padding: "4px 10px", color: "#00d4aa", fontSize: 11, fontWeight: 700,
            }}>{val}</div>
          ))}
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: "24px", marginBottom: 16,
      }}>
        <label style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>SCRATCH CODE</label>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={19}
          style={{
            width: "100%", marginTop: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "14px", color: "#fff", fontSize: 18,
            fontWeight: 700, letterSpacing: "3px", outline: "none",
            textAlign: "center", boxSizing: "border-box",
          }}
        />
        {result && (
          <div style={{
            marginTop: 12,
            background: result.success ? "rgba(0,212,170,0.1)" : "rgba(255,80,80,0.1)",
            border: result.success ? "1px solid rgba(0,212,170,0.3)" : "1px solid rgba(255,80,80,0.3)",
            borderRadius: 10, padding: "10px 14px",
            color: result.success ? "#00d4aa" : "#ff6b6b",
            fontSize: 13, fontWeight: 600, textAlign: "center",
          }}>
            {result.success ? `✅ SRD ${result.amount} toegevoegd aan jouw wallet!` : `❌ ${result.message}`}
          </div>
        )}
      </div>

      <button onClick={handleRedeem} disabled={loading} style={{
        width: "100%",
        background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #00d4aa, #0099ff)",
        border: "none", borderRadius: 14, padding: "16px", color: "#fff",
        fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 4px 24px rgba(0,212,170,0.25)",
      }}>
        {loading ? "⏳ Verwerken..." : "Code Inwisselen"}
      </button>

      <div style={{ marginTop: 24 }}>
        <div style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>WAAR KOPEN?</div>
        {[
          { icon: "🏪", name: "Partnerwinkels Paramaribo", sub: "20+ locaties" },
          { icon: "⛽", name: "Benzienstations", sub: "Staatsolie partners" },
          { icon: "📱", name: "SuriPay agenten", sub: "Binnenkort beschikbaar" },
        ].map((loc, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center",
            background: "rgba(255,255,255,0.03)", borderRadius: 12,
            padding: "12px 14px", marginBottom: 8,
          }}>
            <span style={{ fontSize: 20, marginRight: 12 }}>{loc.icon}</span>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{loc.name}</div>
              <div style={{ color: "#6b8ab0", fontSize: 11 }}>{loc.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card Screen ───────────────────────────────────────────────────────────
function CardScreen({ user, profile }) {
  const name = profile?.full_name || user?.user_metadata?.full_name || "SuriPay Gebruiker";
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: "56px 24px 80px",
    }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Mijn virtuele kaart</div>
      <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 32 }}>Gebruik overal ter wereld</div>

      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 24, padding: "28px 24px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "rgba(0,212,170,0.1)", borderRadius: "50%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ width: 44, height: 32, background: "linear-gradient(135deg, #ffd700, #ffaa00)", borderRadius: 6 }} />
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, fontStyle: "italic" }}>VISA</div>
        </div>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "3px", marginBottom: 20 }}>
          •••• •••• •••• ••••
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#6b8ab0", fontSize: 10, fontWeight: 600 }}>KAARTHOUDER</div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{name.toUpperCase()}</div>
          </div>
          <div>
            <div style={{ color: "#6b8ab0", fontSize: 10, fontWeight: 600 }}>STATUS</div>
            <div style={{ color: "#ffb400", fontSize: 13, fontWeight: 700, marginTop: 2 }}>Binnenkort</div>
          </div>
        </div>
      </div>

      <div style={{
        background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)",
        borderRadius: 14, padding: "14px 16px", color: "#00d4aa",
        fontSize: 13, fontWeight: 600, textAlign: "center",
      }}>
        🔗 Virtuele Visa kaart wordt gekoppeld via Stripe Issuing
      </div>
    </div>
  );
}

// ─── QR Screen ─────────────────────────────────────────────────────────────
function QRScreen({ user, profile }) {
  const name = profile?.full_name || user?.user_metadata?.full_name || "SuriPay Gebruiker";
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: "56px 24px 80px",
    }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>QR Betaling</div>
      <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 32 }}>Jouw persoonlijke betaal QR code</div>

      <div style={{ background: "#fff", borderRadius: 24, padding: "28px", textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 180, height: 180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 2 }}>
          {Array.from({ length: 81 }).map((_, i) => (
            <div key={i} style={{ background: [0,1,2,9,10,18,6,7,8,15,16,17,72,73,74,63,64,54,55,56].includes(i) || Math.random() > 0.5 ? "#0a1628" : "#fff", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ color: "#0a1628", fontSize: 13, fontWeight: 700, marginTop: 16 }}>{name}</div>
        <div style={{ color: "#6b8ab0", fontSize: 11, marginTop: 2 }}>SuriPay · Veilig betalen</div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button style={{
          flex: 1, background: "linear-gradient(135deg, #00d4aa, #0099ff)",
          border: "none", borderRadius: 14, padding: "14px", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>📤 Delen</button>
        <button style={{
          flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "14px", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>📷 Scannen</button>
      </div>
    </div>
  );
}

// ─── KYC Screen ────────────────────────────────────────────────────────────
function KYCScreen({ user }) {
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("status")
        .eq("user_id", user.id)
        .single();
      if (data) setKycStatus(data.status);
    };
    checkStatus();
  }, [user.id]);

  const uploadFile = async (file, path) => {
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    if (!whatsapp || whatsapp.length < 7) { setError("Voer een geldig WhatsApp nummer in"); return; }
    setLoading(true);
    setError(null);
    try {
      const uid = user.id;
      const frontPath = await uploadFile(idFront, `${uid}/id_front.jpg`);
      const backPath = await uploadFile(idBack, `${uid}/id_back.jpg`);
      const selfiePath = await uploadFile(selfie, `${uid}/selfie.jpg`);
      const { error: dbError } = await supabase
        .from("kyc_submissions")
        .upsert({
          user_id: uid,
          id_front_url: frontPath,
          id_back_url: backPath,
          selfie_url: selfiePath,
          whatsapp,
          status: "pending",
        });
      if (dbError) throw dbError;
      setSuccess(true);
      setKycStatus("pending");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const statusBanner = () => {
    if (kycStatus === "approved") return { color: "#00d4aa", bg: "rgba(0,212,170,0.1)", border: "rgba(0,212,170,0.3)", text: "✅ Je identiteit is geverifieerd!" };
    if (kycStatus === "pending") return { color: "#ffb400", bg: "rgba(255,180,0,0.1)", border: "rgba(255,180,0,0.3)", text: "⏳ Je verificatie wordt beoordeeld." };
    if (kycStatus === "rejected") return { color: "#ff6b6b", bg: "rgba(255,80,80,0.1)", border: "rgba(255,80,80,0.3)", text: "❌ Verificatie afgekeurd. Upload opnieuw." };
    return null;
  };

  const banner = statusBanner();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a1628 0%, #0d2445 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: "56px 24px 80px",
    }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Identiteitsverificatie</div>
      <div style={{ color: "#6b8ab0", fontSize: 13, marginBottom: 24 }}>Upload je ID om je account te verifiëren</div>

      {banner && (
        <div style={{
          background: banner.bg, border: `1px solid ${banner.border}`,
          borderRadius: 14, padding: "14px 16px", color: banner.color,
          fontSize: 13, fontWeight: 600, marginBottom: 24, textAlign: "center",
        }}>{banner.text}</div>
      )}

      {(kycStatus === "approved") ? null : (
        <>
          {[
            { label: "Voorkant ID", setter: setIdFront, value: idFront },
            { label: "Achterkant ID", setter: setIdBack, value: idBack },
            { label: "Selfie met ID", setter: setSelfie, value: selfie },
          ].map((field, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px", marginBottom: 12,
            }}>
              <div style={{ color: "#8aa4c8", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                {field.label.toUpperCase()}
              </div>
              <input
                type="file" accept="image/*,application/pdf"
                onChange={e => field.setter(e.target.files[0])}
                style={{ color: "#fff", fontSize: 13, width: "100%" }}
              />
              {field.value && (
                <div style={{ color: "#00d4aa", fontSize: 11, marginTop: 6 }}>
                  ✓ {field.value.name}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div style={{
              background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#ff6b6b",
              fontSize: 13, marginBottom: 16,
            }}>❌ {error}</div>
          )}

          {!success && (
            <button
              onClick={handleSubmit}
              disabled={loading || !idFront || !idBack || !selfie}
              style={{
                width: "100%",
                background: (!idFront || !idBack || !selfie)
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #00d4aa, #0099ff)",
                border: "none", borderRadius: 14, padding: "16px",
                color: "#fff", fontSize: 16, fontWeight: 800,
                cursor: (!idFront || !idBack || !selfie) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 24px rgba(0,212,170,0.25)",
              }}
            >
              {loading ? "⏳ Bezig met uploaden..." : "Indienen"}
            </button>
          )}

          {success && (
            <div style={{
              background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)",
              borderRadius: 16, padding: 24, textAlign: "center", color: "#00d4aa", fontWeight: 700,
            }}>
              ✅ Documenten ingediend! We controleren ze zo snel mogelijk.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase.from("users").select("*").eq("id", userId).single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setScreen(SCREENS.DASHBOARD);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setScreen(SCREENS.DASHBOARD);
      } else {
        setScreen(SCREENS.LOGIN);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTopupSuccess = () => {
    if (user) fetchProfile(user.id);
    setScreen(SCREENS.DASHBOARD);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a1628",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ color: "#00d4aa", fontSize: 16, fontWeight: 700 }}>SuriPay laden...</div>
      </div>
    );
  }

  if (!user) {
    if (screen === SCREENS.REGISTER) return <RegisterScreen onGoLogin={() => setScreen(SCREENS.LOGIN)} />;
    return <LoginScreen onGoRegister={() => setScreen(SCREENS.REGISTER)} />;
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {screen === SCREENS.DASHBOARD && <DashboardScreen user={user} profile={profile} onLogout={handleLogout} setScreen={setScreen} />}
      {screen === SCREENS.CARD && <CardScreen user={user} profile={profile} />}
      {screen === SCREENS.TOPUP && <TopupScreen user={user} onSuccess={handleTopupSuccess} />}
      {screen === SCREENS.QR && <QRScreen user={user} profile={profile} />}
      {screen === SCREENS.KYC && <KYCScreen user={user} />}
      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  );
}