import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 "proxy" (voorheen middleware): draait server-side vóór elke pagina,
// vernieuwt de Supabase-sessie via cookies en stuurt niet-ingelogde gebruikers
// naar /login. Echte autorisatie blijft in de API-routes (bearer-token) en RLS.

// Publiek toegankelijk zonder login.
const PUBLIC_PATHS = ["/", "/login", "/register"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // BELANGRIJK: getUser() vernieuwt de sessie en zet eventueel nieuwe cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  // Niet ingelogd op een beschermde route → naar /login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Draai op alles behalve API-routes, statische bestanden en assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
