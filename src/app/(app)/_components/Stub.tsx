// Tijdelijke placeholder voor schermen die nog gebouwd worden.
export default function Stub({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ paddingTop: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
        {icon} {title}
      </h2>
      <div
        style={{
          background: "rgba(255,255,255,.05)",
          borderRadius: 16,
          padding: 28,
          textAlign: "center",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 10 }}>🚧</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          Binnenkort beschikbaar
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>
          Dit scherm wordt in een volgende stap gebouwd.
        </div>
      </div>
    </div>
  );
}
