import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Wissel tussen valuta binnen de eigen wallet (SRD ↔ vreemd / vreemd ↔ vreemd).
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const { from, to, amount } = await req.json();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const amountNum = Number(amount);
    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      !Number.isFinite(amountNum) ||
      amountNum <= 0
    )
      return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });

    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!rateLimit(`exchange:${user.id}`, 12, 60_000))
      return NextResponse.json({ error: "Te veel pogingen. Wacht even." }, { status: 429 });

    const { data: result, error } = await admin.rpc("exchange_currency", {
      p_user_id: user.id,
      p_from: from,
      p_to: to,
      p_amount: amountNum,
    });

    if (error || !result?.success)
      return NextResponse.json(
        { error: result?.error ?? error?.message ?? "Wisselen mislukt" },
        { status: 400 }
      );

    return NextResponse.json({ success: true, to_amount: result.to_amount });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
