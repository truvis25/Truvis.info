import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

// Best-effort per-instance rate limit for auth form submissions (launch
// hardening). Serverless instances each keep their own bucket, so this caps
// bursts rather than being a hard global limit — replace with a shared store
// (Upstash) when scale demands.
const authHits = new Map<string, { count: number; resetAt: number }>();
const AUTH_LIMIT = 10;
const AUTH_WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = authHits.get(ip);
  if (!bucket || bucket.resetAt < now) {
    authHits.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  if (authHits.size > 5000) authHits.clear();
  return bucket.count > AUTH_LIMIT;
}

// Refreshes the Supabase session on every matched request and gates the
// dashboard/admin areas (optimistic check — pages re-verify server-side).
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (request.method === "POST" && (path === "/login" || path === "/signup")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (rateLimited(ip)) {
      return new NextResponse("Too many attempts. Try again in a minute.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth = path.startsWith("/dashboard") || path.startsWith("/admin");
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
