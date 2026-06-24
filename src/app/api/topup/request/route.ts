import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Gebruiker dient een opwaardeerverzoek in (status 'pending').
// Het saldo verandert pas wanneer een admin het verzoek goedkeurt.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const { amount, method, reference } = await req.json();
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

    if (!rateLimit(`topup:${user.id}`, 6, 60_000))
      return NextResponse.json({ error: "Te veel verzoeken. Wacht even." }, { status: 429 });

    const { error } = await admin.from("topup_requests").insert({
      user_id: user.id,
      amount: amountNum,
      method: method === "agent" ? "agent" : "bank",
      reference: typeof reference === "string" ? reference.slice(0, 120) : null,
      status: "pending",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
