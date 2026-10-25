import { organiser } from "../../../lib/supabase";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../../lib/config";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });
async function handle(request: Request) {
  const url = new URL(request.url),
    path = url.pathname;
  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin)
      return json({ error: "This request must come from Founder House." }, 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > 3500000)
    return json({ error: "Your CV must be a PDF under 3 MB." }, 413);
  const adminRoute = path.startsWith("/api/admin");
  let accessToken = SUPABASE_ANON_KEY;
  if (path === "/api/me" || adminRoute) {
    const identity = await organiser();
    if (path === "/api/me")
      return json({
        authenticated: !!identity.user,
        admin: identity.admin,
        configured: true,
        email: identity.user?.email ?? null,
      });
    if (!identity.admin || !identity.accessToken)
      return json(
        { error: "Sign in with an authorised TRUVIS organiser account." },
        403,
      );
    accessToken = identity.accessToken;
  }
  const headers = new Headers({
    authorization: "Bearer " + accessToken,
    apikey: SUPABASE_ANON_KEY,
    "x-fh-path": path,
    "x-fh-origin": url.origin,
    "x-fh-client-ip":
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown",
  });
  const type = request.headers.get("content-type");
  if (type) headers.set("content-type", type);
  const memberCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("fh_member="));
  if (memberCookie) headers.set("x-fh-member-token", memberCookie.slice(10));
  try {
    const method = request.method,
      body = ["GET", "HEAD"].includes(method)
        ? undefined
        : await request.arrayBuffer();
    const response = await fetch(SUPABASE_URL + "/functions/v1/founder-house", {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    const outputHeaders = new Headers({
      "content-type":
        response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    const disposition = response.headers.get("content-disposition");
    if (disposition) outputHeaders.set("content-disposition", disposition);
    if (path === "/api/member/login" && response.ok) {
      const data = JSON.parse(new TextDecoder().decode(body)) as {
        access: string;
      };
      if (/^[a-f0-9]{64}$/.test(data.access))
        outputHeaders.set(
          "set-cookie",
          `fh_member=${data.access}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
        );
    }
    if (path === "/api/member/logout")
      outputHeaders.set(
        "set-cookie",
        "fh_member=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      );
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: outputHeaders,
    });
  } catch {
    return json(
      {
        error:
          "We could not reach the membership desk. Please try again or contact info@truvis.info.",
      },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
