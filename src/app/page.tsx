import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--brand-light)" }}>
      <div className="text-center px-6">
        <h1 className="text-5xl font-bold mb-2"
          style={{ color: "var(--brand-green)" }}>
          SuriPay
        </h1>
        <p className="text-lg mb-8"
          style={{ color: "var(--neutral-600)" }}>
          Suriname's digitale wallet
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login"
            className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: "var(--brand-green)" }}>
            Inloggen
          </Link>
          <Link href="/register"
            className="px-6 py-3 rounded-xl font-semibold border"
            style={{ borderColor: "var(--brand-green)",
                     color: "var(--brand-green)" }}>
            Registreren
          </Link>
        </div>
      </div>
    </main>
  );
}