import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

// Service-role: zet/wijzigt de PIN server-side (hash verlaat de server niet).
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const { currentPin, newPin } = await req.json();

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!/^\d{6}$/.test(newPin ?? ""))
      return NextResponse.json({ error: "PIN moet 6 cijfers zijn" }, { status: 400 });

    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!rateLimit(`pinset:${user.id}`, 10, 60_000))
      return NextResponse.json({ error: "Te veel pogingen. Wacht even." }, { status: 429 });

    const { data: wallet, error: wErr } = await admin
      .from("wallets")
      .select("id, pin_hash")
      .eq("user_id", user.id)
      .single();
    if (wErr || !wallet)
      return NextResponse.json({ error: "Wallet niet gevonden" }, { status: 404 });

    // Bestaat er al een PIN? Dan moet de huidige kloppen.
    if (wallet.pin_hash) {
      const ok =
        typeof currentPin === "string" &&
        (await bcrypt.compare(currentPin, wallet.pin_hash));
      if (!ok)
        return NextResponse.json({ error: "Huidige PIN is onjuist" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPin, 10);
    const { error: upErr } = await admin
      .from("wallets")
      .update({ pin_hash: hash })
      .eq("id", wallet.id);
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 400 });

    // Lockout-tellers resetten (best-effort; kolommen bestaan pas na db/005).
    await admin
      .from("wallets")
      .update({ failed_pin_attempts: 0, pin_locked_until: null })
      .eq("id", wallet.id)
      .then(undefined, () => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
