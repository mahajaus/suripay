import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Gebruiker dient een opnameverzoek in. Het bedrag wordt DIRECT gereserveerd
// (gedebiteerd) zodat het niet dubbel besteed kan worden; admin markeert later
// als uitbetaald, of wijst af (dan volgt een refund).
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const { amount, method, destination } = await req.json();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return NextResponse.json({ error: "Ongeldig bedrag" }, { status: 400 });

    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!rateLimit(`withdraw:${user.id}`, 6, 60_000))
      return NextResponse.json({ error: "Te veel verzoeken. Wacht even." }, { status: 429 });

    // Reserveer (debiteer) het bedrag.
    const { data: debit, error: debitErr } = await admin.rpc("admin_debit_wallet", {
      p_user_id: user.id,
      p_amount: amountNum,
      p_type: "cashout",
      p_description: "Opname (in behandeling)",
    });
    if (debitErr || !debit?.success)
      return NextResponse.json(
        { error: debit?.error ?? debitErr?.message ?? "Opname mislukt" },
        { status: 400 }
      );

    const { error } = await admin.from("withdrawals").insert({
      user_id: user.id,
      amount: amountNum,
      method: method === "agent" ? "agent" : "bank",
      destination: typeof destination === "string" ? destination.slice(0, 160) : null,
      status: "pending",
    });
    if (error) {
      // Inzet mislukt → refund zodat het saldo niet verdwijnt.
      await admin.rpc("admin_credit_wallet", {
        p_user_id: user.id,
        p_amount: amountNum,
        p_type: "cashout",
        p_description: "Opname teruggedraaid",
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
