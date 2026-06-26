import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";

// Service-role client: omzeilt RLS bewust, alleen server-side.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verifieer de bearer-token en eis een admin-account.
async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// GET — lijst openstaande inzendingen met getekende foto-URL's.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: subs, error } = await admin
    .from("kyc_submissions")
    .select("id, user_id, requested_tier, selfie_path, id_doc_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const items = [];
  for (const s of subs ?? []) {
    const { data: applicant } = await admin.auth.admin.getUserById(s.user_id);
    const selfie_url = s.selfie_path
      ? (await admin.storage.from("kyc").createSignedUrl(s.selfie_path, 120))
          .data?.signedUrl ?? null
      : null;
    const id_doc_url = s.id_doc_path
      ? (await admin.storage.from("kyc").createSignedUrl(s.id_doc_path, 120))
          .data?.signedUrl ?? null
      : null;

    items.push({
      id: s.id,
      user_id: s.user_id,
      requested_tier: s.requested_tier,
      created_at: s.created_at,
      email: applicant?.user?.email ?? null,
      full_name: applicant?.user?.user_metadata?.full_name ?? null,
      selfie_url,
      id_doc_url,
    });
  }

  return NextResponse.json({ items });
}

// POST — keur een inzending goed of af. Goedkeuren hoogt wallets.tier op.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, decision, reason } = await req.json();
  if (!id || (decision !== "approve" && decision !== "reject"))
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });

  const { data: sub, error: subErr } = await admin
    .from("kyc_submissions")
    .select("user_id, requested_tier, status")
    .eq("id", id)
    .single();

  if (subErr || !sub)
    return NextResponse.json({ error: "Inzending niet gevonden" }, { status: 404 });
  if (sub.status !== "pending")
    return NextResponse.json({ error: "Al beoordeeld" }, { status: 409 });

  if (decision === "approve") {
    const { error: wErr } = await admin
      .from("wallets")
      .update({ tier: sub.requested_tier })
      .eq("user_id", sub.user_id);
    if (wErr)
      return NextResponse.json({ error: wErr.message }, { status: 400 });
  }

  const { error: uErr } = await admin
    .from("kyc_submissions")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reject_reason:
        decision === "reject" && typeof reason === "string"
          ? reason.slice(0, 300)
          : null,
    })
    .eq("id", id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
