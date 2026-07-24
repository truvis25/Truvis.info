// Next.js instrumentation. onRequestError aggregates server-side errors into a
// single structured log line — immediately searchable in Vercel logs, and the
// exact seam to forward into Sentry later (add @sentry/nextjs + SENTRY_DSN and
// call captureException here).
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
): Promise<void> {
  const err = error as { message?: string; stack?: string; digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      source: "onRequestError",
      message: err?.message ?? String(error),
      digest: err?.digest,
      path: request?.path,
      method: request?.method,
      stack: err?.stack,
    }),
  );
}
