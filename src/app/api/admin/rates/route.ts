import { NextRequest, NextResponse } from "next/server";
import { serviceClient as admin, requireAdmin } from "@/lib/serverAdmin";

// GET — alle valuta + koersen (ook uitgeschakelde).
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("currencies")
    .select("code, name, symbol, buy_srd, sell_srd, sort_order, enabled")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

// POST — werk koers en/of beschikbaarheid van één valuta bij.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, buy_srd, sell_srd, enabled } = await req.json();
  if (typeof code !== "string" || !code)
    return NextResponse.json({ error: "Ongeldige valuta" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // SRD is de basis (koers = 1) en mag niet gewijzigd worden.
  if (code !== "SRD") {
    if (buy_srd !== undefined) {
      const r = Number(buy_srd);
      if (!Number.isFinite(r) || r <= 0)
        return NextResponse.json({ error: "Ongeldige aankoopkoers" }, { status: 400 });
      update.buy_srd = r;
    }
    if (sell_srd !== undefined) {
      const r = Number(sell_srd);
      if (!Number.isFinite(r) || r <= 0)
        return NextResponse.json({ error: "Ongeldige verkoopkoers" }, { status: 400 });
      update.sell_srd = r;
    }
  }
  // SRD (basisvaluta) mag nooit uitgeschakeld worden — anders breekt elke
  // wissel/overboeking (de RPC's vereisen enabled).
  if (typeof enabled === "boolean" && code !== "SRD") update.enabled = enabled;

  const { error } = await admin.from("currencies").update(update).eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
