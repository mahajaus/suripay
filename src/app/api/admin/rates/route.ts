import { NextRequest, NextResponse } from "next/server";
import { serviceClient as admin, requireAdmin } from "@/lib/serverAdmin";

// GET — alle valuta + koersen (ook uitgeschakelde).
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("currencies")
    .select("code, name, symbol, srd_per_unit, sort_order, enabled")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

// POST — werk koers en/of beschikbaarheid van één valuta bij.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, srd_per_unit, enabled } = await req.json();
  if (typeof code !== "string" || !code)
    return NextResponse.json({ error: "Ongeldige valuta" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // SRD is de basis (koers = 1) en mag niet gewijzigd worden.
  if (srd_per_unit !== undefined && code !== "SRD") {
    const r = Number(srd_per_unit);
    if (!Number.isFinite(r) || r <= 0)
      return NextResponse.json({ error: "Ongeldige koers" }, { status: 400 });
    update.srd_per_unit = r;
  }
  if (typeof enabled === "boolean") update.enabled = enabled;

  const { error } = await admin.from("currencies").update(update).eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
