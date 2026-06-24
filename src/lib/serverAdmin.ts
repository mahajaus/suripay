import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";

// Gedeelde service-role client + admin-poort voor /api/admin/* routes.
export const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const {
    data: { user },
  } = await serviceClient.auth.getUser(token);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
