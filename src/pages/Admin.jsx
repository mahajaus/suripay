import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jouw-project.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "jouw-anon-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode() {
  const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}
function generateBatchId() {
  return "BATCH-" + Date.now().toString(36).toUpperCase();
}

const VALUE_COLORS = {
  50:  { bg: "rgba(0,212,170,0.12)", border: "rgba(0,212,170,0.3)", text: "#00d4aa" },
  100: { bg: "rgba(0,153,255,0.12)", border: "rgba(0,153,255,0.3)", text: "#0099ff" },
  250: { bg: "rgba(255,180,0,0.12)", border: "rgba(255,180,0,0.3)",  text: "#ffb400" },
};
const STATUS_COLORS = {
  unused:   { bg: "rgba(0,212,170,0.1)",   text: "#00d4aa",  label: "Beschikbaar" },
  redeemed: { bg: "rgba(100,100,120,0.2)", text: "#8aa4c8",  label: "Inwisseld" },
  expired:  { bg: "rgba(255,80,80,0.1)",   text: "#ff6b6b",  label: "Verlopen" },
};

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${accent}30`,
      borderRadius: 16, padding: "18px 14px",
      flex: 1, minWidth: 0, textAlign: "center",
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: accent, fontSize: 18, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#8aa4c8", fontSize: 10, fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  const color = type === "success" ? "#00d4aa" : "#ff6b6b";
  const bg = type === "success" ? "rgba(0,212,170,0.1)" : "rgba(255,80,80,0.1)";
  const border = type === "success" ? "rgba(0,212,170,0.3)" : "rgba(255,80,80,0.3)";
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: "10px 14px",
      color, fontSize: 12, fontWeight: 700,
      textAlign: "center", marginBottom: 12,
    }}>
      {message}
    </div>
  );
}

function CodeRow({ card, onCopy }) {
  const sc = STATUS_COLORS[card.status] || STATUS_COLORS.unused;
  const val = parseInt(card.value_srd);
  const vc = VALUE_COLORS[val] || VALUE_COLORS[50];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "12px 14px", marginBottom: 8,
    }}>
      <div style={{
        background: vc.bg, border: `1px solid ${vc.border}`,
        borderRadius: 8, padding: "3px 8px",
        color: vc.text, fontSize: 11, fontWeight: 800,
        whiteSpace: "nowrap", minWidth: 52, textAlign: "center",
      }}>SRD {val}</div>
      <div style={{
        flex: 1, color: card.status === "unused" ? "#fff" : "#4a6080",
        fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", fontFamily: "monospace",
      }}>{card.code}</div>
      <div style={{
        background: sc.bg, borderRadius: 8,
        padding: "3px 8px", color: sc.text,
        fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
      }}>{sc.label}</div>
      {card.status === "unused" && (
        <button onClick={() => onCopy(card.code)} style={{
          background: "rgba(255,255,255,0.08)", border: "none",
          borderRadius: 8, padding: "5px 10px",
          color: "#8aa4c8", fontSize: 11, cursor: "pointer", fontWeight: 600,
        }}>📋</button>
      )}
    </div>
  );
}

function OverviewTab({ cards, loading, onCopy, toast }) {
  const [filter, setFilter] = useState("all");
  const filtered = cards.filter(c => filter === "all" ? true : c.status === filter);
  const stats = {
    total: cards.length,
    unused: cards.filter(c => c.status === "unused").length,
    value: cards.filter(c => c.status === "unused").reduce((s, c) => s + parseFloat(c.value_srd || 0), 0),
  };
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <StatCard icon="🎫" label="Totaal" value={stats.total} accent="#8aa4c8" />
        <StatCard icon="✅" label="Beschikbaar" value={stats.unused} accent="#00d4aa" />
        <StatCard icon="💰" label="Waarde SRD" value={stats.value.toFixed(0)} accent="#ffb400" />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "all", label: "Alle" },
          { id: "unused", label: "Beschikbaar" },
          { id: "redeemed", label: "Inwisseld" },
          { id: "expired", label: "Verlopen" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flex: 1, padding: "7px 4px",
            background: filter === f.id ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.04)",
            border: filter === f.id ? "1px solid rgba(0,212,170,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            color: filter === f.id ? "#00d4aa" : "#6b8ab0",
            fontSize: 10, fontWeight: 700, cursor: "pointer",
          }}>{f.label}</button>
        ))}
      </div>
      <Toast {...toast} />
      {loading ? (
        <div style={{ textAlign: "center", color: "#6b8ab0", padding: "40px 0" }}>Laden...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b8ab0", padding: "40px 0", fontSize: 13 }}>Geen kaarten gevonden</div>
      ) : (
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {filtered.map(card => <CodeRow key={card.id} card={card} onCopy={onCopy} />)}
        </div>
      )}
    </>
  );
}

function GenerateTab({ onGenerate, loading }) {
  const [count, setCount] = useState(10);
  const [value, setValue] = useState(50);
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px" }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>⚡ Nieuwe batch aanmaken</div>
      <div style={{ color: "#6b8ab0", fontSize: 12, marginBottom: 20 }}>Codes worden direct opgeslagen in Supabase</div>

      <label style={{ color: "#8aa4c8", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" }}>AANTAL KAARTEN</label>
      <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 20 }}>
        {[5, 10, 25, 50].map(n => (
          <button key={n} onClick={() => setCount(n)} style={{
            flex: 1, padding: "10px 0",
            background: count === n ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.05)",
            border: count === n ? "1px solid rgba(0,212,170,0.5)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, color: count === n ? "#00d4aa" : "#8aa4c8",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>{n}</button>
        ))}
      </div>

      <label style={{ color: "#8aa4c8", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" }}>WAARDE PER KAART</label>
      <div style={{ display: "flex", gap: 10, marginTop: 8, marginBottom: 20 }}>
        {[50, 100, 250].map(v => {
          const c = VALUE_COLORS[v];
          return (
            <button key={v} onClick={() => setValue(v)} style={{
              flex: 1, padding: "14px 0",
              background: value === v ? c.bg : "rgba(255,255,255,0.04)",
              border: value === v ? `1px solid ${c.border}` : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, color: value === v ? c.text : "#6b8ab0",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
            }}>SRD {v}</button>
          );
        })}
      </div>

      <div style={{
        background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)",
        borderRadius: 12, padding: "12px 16px",
        display: "flex", justifyContent: "space-between", marginBottom: 16,
      }}>
        <div style={{ color: "#6b8ab0", fontSize: 12 }}>{count} kaarten × SRD {value}</div>
        <div style={{ color: "#00d4aa", fontSize: 16, fontWeight: 900 }}>= SRD {count * value}</div>
      </div>

      <button onClick={() => onGenerate(count, value)} disabled={loading} style={{
        width: "100%",
        background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #00d4aa, #0099ff)",
        border: "none", borderRadius: 14, padding: "15px",
        color: "#fff", fontSize: 15, fontWeight: 800,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 4px 24px rgba(0,212,170,0.25)",
      }}>
        {loading ? "⏳ Opslaan in Supabase..." : "⚡ Batch genereren & opslaan"}
      </button>
    </div>
  );
}

function ValidateTab() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    const { data, error } = await supabase.from("scratch_cards").select("*").eq("code", input.trim().toUpperCase()).single();
    setLoading(false);
    if (error || !data) { setResult({ type: "notfound" }); return; }
    if (data.status === "redeemed") { setResult({ type: "used", card: data }); return; }
    if (data.status === "expired")  { setResult({ type: "expired" }); return; }
    setResult({ type: "valid", card: data });
  };

  const handleRedeem = async () => {
    if (!result?.card) return;
    setLoading(true);
    const { error } = await supabase.from("scratch_cards").update({ status: "redeemed", redeemed_at: new Date().toISOString() }).eq("id", result.card.id);
    setLoading(false);
    if (error) { setResult({ type: "error" }); return; }
    setResult({ type: "redeemed", card: result.card });
    setInput("");
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px" }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🔍 Code valideren</div>
      <div style={{ color: "#6b8ab0", fontSize: 12, marginBottom: 20 }}>Controleert live in Supabase database</div>
      <input value={input} onChange={e => { setInput(e.target.value.toUpperCase()); setResult(null); }} placeholder="XXXX-XXXX-XXXX-XXXX"
        style={{ width: "100%", marginBottom: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "13px 14px", color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "2px", outline: "none", boxSizing: "border-box", textAlign: "center", fontFamily: "monospace" }}
      />
      <button onClick={handleValidate} disabled={loading} style={{ width: "100%", marginBottom: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        {loading ? "Controleren..." : "Valideren in Supabase"}
      </button>
      {result && (
        <div style={{ borderRadius: 12, padding: "14px 16px", background: result.type === "valid" ? "rgba(0,212,170,0.1)" : result.type === "redeemed" ? "rgba(0,212,170,0.08)" : "rgba(255,80,80,0.1)", border: result.type === "valid" || result.type === "redeemed" ? "1px solid rgba(0,212,170,0.3)" : "1px solid rgba(255,80,80,0.3)" }}>
          {result.type === "valid" && (<>
            <div style={{ color: "#00d4aa", fontWeight: 800, fontSize: 14 }}>✅ Geldig — SRD {result.card.value_srd}</div>
            <button onClick={handleRedeem} disabled={loading} style={{ marginTop: 12, width: "100%", background: "linear-gradient(135deg, #00d4aa, #0099ff)", border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              {loading ? "Verwerken..." : "💰 Inwisselen"}
            </button>
          </>)}
          {result.type === "redeemed" && <div style={{ color: "#00d4aa", fontWeight: 800, fontSize: 14 }}>🎉 Succesvol inwisseld! SRD {result.card.value_srd} toegevoegd.</div>}
          {result.type === "used" && <div style={{ color: "#ff6b6b", fontWeight: 800, fontSize: 14 }}>❌ Code al eerder gebruikt</div>}
          {result.type === "expired" && <div style={{ color: "#ff6b6b", fontWeight: 800, fontSize: 14 }}>⏰ Code is verlopen</div>}
          {result.type === "notfound" && <div style={{ color: "#ff6b6b", fontWeight: 800, fontSize: 14 }}>❌ Code niet gevonden in database</div>}
          {result.type === "error" && <div style={{ color: "#ff6b6b", fontWeight: 800, fontSize: 14 }}>⚠️ Fout bij verwerken — probeer opnieuw</div>}
        </div>
      )}
    </div>
  );
}

// ─── KYC Tab ───────────────────────────────────────────────────────────────
function KYCTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null }), 3000);
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kyc_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const getImageUrl = (path) => {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/kyc-documents/${path}`;
};

  const handleAction = async (status) => {
    if (!selected) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("kyc_submissions")
      .update({
        status,
        notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin",
      })
      .eq("id", selected.id);
    setActionLoading(false);
    if (error) { showToast("Fout bij opslaan", "error"); return; }
    showToast(status === "approved" ? "✅ KYC goedgekeurd!" : "❌ KYC afgekeurd", status === "approved" ? "success" : "error");
    setSelected(null);
    setNotes("");
    fetchSubmissions();
  };

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: "rgba(255,180,0,0.15)", color: "#ffb400", label: "⏳ In behandeling" },
      approved: { bg: "rgba(0,212,170,0.15)", color: "#00d4aa", label: "✅ Goedgekeurd" },
      rejected: { bg: "rgba(255,80,80,0.15)",  color: "#ff6b6b", label: "❌ Afgekeurd" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
        {s.label}
      </span>
    );
  };

  const stats = {
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <StatCard icon="⏳" label="In behandeling" value={stats.pending} accent="#ffb400" />
        <StatCard icon="✅" label="Goedgekeurd" value={stats.approved} accent="#00d4aa" />
        <StatCard icon="❌" label="Afgekeurd" value={stats.rejected} accent="#ff6b6b" />
      </div>

      <Toast {...toast} />

      {/* Detail view */}
      {selected && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>📋 KYC Review</div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#6b8ab0", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ color: "#8aa4c8", fontSize: 11, marginBottom: 4 }}>USER ID</div>
          <div style={{ color: "#fff", fontSize: 12, fontFamily: "monospace", marginBottom: 16 }}>{selected.user_id}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Voorkant ID", path: selected.id_front_url },
              { label: "Achterkant ID", path: selected.id_back_url },
              { label: "Selfie met ID", path: selected.selfie_url },
            ].map((doc, i) => (
              <div key={i}>
                <div style={{ color: "#8aa4c8", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>{doc.label.toUpperCase()}</div>
                {doc.path ? (
                  <a href={getImageUrl(doc.path)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getImageUrl(doc.path)}
                      alt={doc.label}
                      style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                      onError={e => e.target.style.display = "none"}
                    />
                  </a>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 20, textAlign: "center", color: "#4a6080", fontSize: 11 }}>Geen foto</div>
                )}
              </div>
            ))}
          </div>

          <label style={{ color: "#8aa4c8", fontSize: 11, fontWeight: 700 }}>NOTITIES (OPTIONEEL)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reden voor afkeuring of opmerkingen..."
            style={{ width: "100%", marginTop: 8, marginBottom: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 60 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleAction("approved")} disabled={actionLoading} style={{ flex: 1, background: "linear-gradient(135deg, #00d4aa, #0099ff)", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              {actionLoading ? "Opslaan..." : "✅ Goedkeuren"}
            </button>
            <button onClick={() => handleAction("rejected")} disabled={actionLoading} style={{ flex: 1, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 12, padding: "12px", color: "#ff6b6b", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              {actionLoading ? "Opslaan..." : "❌ Afkeuren"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#6b8ab0", padding: "40px 0" }}>Laden...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b8ab0", padding: "40px 0", fontSize: 13 }}>Nog geen KYC aanvragen</div>
      ) : (
        submissions.map(sub => (
          <div key={sub.id} onClick={() => { setSelected(sub); setNotes(sub.notes || ""); }} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>
                {sub.user_id?.slice(0, 16)}...
              </div>
              <div style={{ color: "#6b8ab0", fontSize: 11 }}>
                {new Date(sub.submitted_at).toLocaleDateString("nl-SR")}
              </div>
            </div>
            {statusBadge(sub.status)}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null }), 3000);
  };

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("scratch_cards").select("*").order("created_at", { ascending: false }).limit(200);
    setLoading(false);
    if (error) { showToast("Fout bij laden — controleer je Supabase verbinding", "error"); return; }
    setCards(data || []);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleGenerate = async (count, value) => {
    setLoading(true);
    const batchId = generateBatchId();
    const rows = Array.from({ length: count }, () => ({
      code: generateCode(), value_srd: value, status: "unused", batch_id: batchId,
      created_by: "admin", expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    const { error } = await supabase.from("scratch_cards").insert(rows);
    setLoading(false);
    if (error) { showToast("Fout bij opslaan — controleer Supabase verbinding", "error"); return; }
    showToast(`✅ ${count} kaarten opgeslagen in Supabase!`, "success");
    await fetchCards();
    setTab("overview");
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`📋 Gekopieerd: ${code}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #080f1e 0%, #0d1f3c 60%, #080f1e 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #00d4aa, #0099ff)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎫</div>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>SuriPay Admin</div>
            <div style={{ color: "#00d4aa", fontSize: 10, fontWeight: 700 }}>● Verbonden met Supabase</div>
          </div>
          <button onClick={fetchCards} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#8aa4c8", fontSize: 11, cursor: "pointer" }}>
            🔄 Vernieuwen
          </button>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "overview", label: "📊 Overzicht" },
            { id: "generate", label: "⚡ Genereren" },
            { id: "validate", label: "🔍 Valideren" },
            { id: "kyc", label: "🪪 KYC" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 4px",
              background: "transparent", border: "none",
              borderBottom: tab === t.id ? "2px solid #00d4aa" : "2px solid transparent",
              color: tab === t.id ? "#00d4aa" : "#6b8ab0",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {tab === "overview" && <OverviewTab cards={cards} loading={loading} onCopy={handleCopy} toast={toast} />}
        {tab === "generate" && <GenerateTab onGenerate={handleGenerate} loading={loading} />}
        {tab === "validate" && <ValidateTab />}
        {tab === "kyc" && <KYCTab />}
      </div>
    </div>
  );
}