import { createBrowserClient } from "@supabase/ssr";

// Browser-client met cookie-based sessie (i.p.v. localStorage), zodat de
// server-side proxy de sessie kan lezen. API blijft identiek voor de
// client-componenten (auth.getUser, getSession, .from(), .rpc(), ...).
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
