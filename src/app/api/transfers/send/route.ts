import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_PIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const { pin, amount, receiver_email, description, from_currency } = await req.json();
    const fromCur = typeof from_currency === "string" && from_currency ? from_currency : "SRD";
    const token = req.headers.get("authorization")?.split(" ")[1];

    // ---- Invoervalidatie ----
    if (!token || typeof pin !== "string" || !amount || typeof receiver_email !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!receiver_email.includes("@")) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ---- Verzender uit token ----
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Rate limit per gebruiker ----
    if (!rateLimit(`transfer:${user.id}`, 8, 60_000)) {
      return NextResponse.json({ error: "Te veel pogingen. Wacht even." }, { status: 429 });
    }

    // ---- Wallet ophalen ----
    const { data: senderWallet, error: senderError } = await supabase
      .from("wallets")
      .select("id, pin_hash, balance")
      .eq("user_id", user.id)
      .single();
    if (senderError || !senderWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // ---- PIN-lockout (best-effort; kolommen bestaan pas na db/005) ----
    let attempts = 0;
    const { data: lk } = await supabase
      .from("wallets")
      .select("failed_pin_attempts, pin_locked_until")
      .eq("id", senderWallet.id)
      .maybeSingle();
    if (lk) {
      attempts = lk.failed_pin_attempts ?? 0;
      if (lk.pin_locked_until && new Date(lk.pin_locked_until) > new Date()) {
        return NextResponse.json(
          { error: "Te veel onjuiste PIN-pogingen. Probeer het later opnieuw." },
          { status: 423 }
        );
      }
    }

    // ---- PIN verifiëren ----
    const isValidPin = senderWallet.pin_hash
      ? await bcrypt.compare(pin, senderWallet.pin_hash)
      : false;

    if (!isValidPin) {
      const nextAttempts = attempts + 1;
      const lockNow = nextAttempts >= MAX_PIN_ATTEMPTS;
      await supabase
        .from("wallets")
        .update({
          failed_pin_attempts: lockNow ? 0 : nextAttempts,
          pin_locked_until: lockNow
            ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
            : null,
        })
        .eq("id", senderWallet.id)
        .then(undefined, () => {});
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Geslaagde PIN → tellers resetten (best-effort).
    if (attempts > 0) {
      await supabase
        .from("wallets")
        .update({ failed_pin_attempts: 0, pin_locked_until: null })
        .eq("id", senderWallet.id)
        .then(undefined, () => {});
    }

    // ---- Ontvanger opzoeken ----
    const { data: receiver } = await supabase.rpc("find_wallet_by_email", {
      p_email: receiver_email,
    });
    if (!receiver?.found) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }
    if (receiver.wallet_id === senderWallet.id) {
      return NextResponse.json({ error: "Je kunt geen geld naar jezelf sturen" }, { status: 400 });
    }

    // ---- Overboeking via RPC (alleen service-role mag dit) ----
    // SRD → bewezen transfer_money; vreemde valuta → transfer_money_fx
    // (ontvanger krijgt altijd SRD-tegenwaarde).
    let result: { success?: boolean; error?: string; transaction_id?: string } | null = null;
    let transferError: { message?: string } | null = null;

    if (fromCur === "SRD") {
      if (senderWallet.balance < amountNum) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      ({ data: result, error: transferError } = await supabase.rpc("transfer_money", {
        p_sender_wallet_id: senderWallet.id,
        p_receiver_wallet_id: receiver.wallet_id,
        p_amount: amountNum,
        p_description: description || `Transfer to ${receiver.full_name}`,
      }));
    } else {
      ({ data: result, error: transferError } = await supabase.rpc("transfer_money_fx", {
        p_sender_wallet_id: senderWallet.id,
        p_receiver_wallet_id: receiver.wallet_id,
        p_from_currency: fromCur,
        p_from_amount: amountNum,
        p_description: description || null,
      }));
    }

    if (transferError || !result?.success) {
      return NextResponse.json(
        { error: result?.error ?? transferError?.message ?? "Transfer failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, transaction_id: result.transaction_id },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
