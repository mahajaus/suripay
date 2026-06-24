import { NextRequest, NextResponse } from "next/server";
import { serviceClient as admin, requireAdmin } from "@/lib/serverAdmin";

// GET — openstaande opwaardeerverzoeken met aanvrager-info.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: rows, error } = await admin
    .from("topup_requests")
    .select("id, user_id, amount, method, reference, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = [];
  for (const r of rows ?? []) {
    const { data: applicant } = await admin.auth.admin.getUserById(r.user_id);
    items.push({
      ...r,
      email: applicant?.user?.email ?? null,
      full_name: applicant?.user?.user_metadata?.full_name ?? null,
    });
  }
  return NextResponse.json({ items });
}

// POST — keur goed (crediteert wallet) of wijs af.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, decision } = await req.json();
  if (!id || (decision !== "approve" && decision !== "reject"))
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });

  const { data: r, error: rErr } = await admin
    .from("topup_requests")
    .select("user_id, amount, method, status")
    .eq("id", id)
    .single();
  if (rErr || !r)
    return NextResponse.json({ error: "Verzoek niet gevonden" }, { status: 404 });
  if (r.status !== "pending")
    return NextResponse.json({ error: "Al beoordeeld" }, { status: 409 });

  if (decision === "approve") {
    const { data: credit, error: cErr } = await admin.rpc("admin_credit_wallet", {
      p_user_id: r.user_id,
      p_amount: r.amount,
      p_type: "topup",
      p_description: `Opwaardering (${r.method})`,
    });
    if (cErr || !credit?.success)
      return NextResponse.json(
        { error: credit?.error ?? cErr?.message ?? "Crediteren mislukt" },
        { status: 400 }
      );
  }

  const { error: uErr } = await admin
    .from("topup_requests")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
