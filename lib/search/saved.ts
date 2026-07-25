// Pure helpers for saved searches + match alerts. No I/O — unit-tested.

export type SearchKind = "directory" | "marketplace";

export type DirectoryParams = {
  q?: string;
  industry?: string;
  jurisdiction?: string;
};

export type MarketplaceParams = {
  q?: string;
  type?: string;
  sector?: string;
  region?: string;
};

export type SearchParams = DirectoryParams & MarketplaceParams;

// Keep only the params that belong to a kind, dropping empties. Used both when
// saving (canonical storage) and when re-running the search in the digest.
export function normalizeParams(
  kind: SearchKind,
  raw: Record<string, string | undefined | null>,
): SearchParams {
  const keys =
    kind === "directory"
      ? (["q", "industry", "jurisdiction"] as const)
      : (["q", "type", "sector", "region"] as const);
  const out: SearchParams = {};
  for (const key of keys) {
    const value = raw[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

// Human-readable label for a saved search (dashboard list + email subject).
export function describeSearch(kind: SearchKind, params: SearchParams): string {
  const bits: string[] = [];
  if (params.q) bits.push(`"${params.q}"`);
  if (kind === "directory") {
    if (params.industry) bits.push(params.industry);
    if (params.jurisdiction) bits.push(params.jurisdiction);
  } else {
    if (params.type) bits.push(params.type.replace(/_/g, " "));
    if (params.sector) bits.push(params.sector);
    if (params.region) bits.push(params.region);
  }
  const base = kind === "directory" ? "Directory" : "Marketplace";
  return bits.length ? `${base}: ${bits.join(" · ")}` : `${base}: all`;
}

// Rebuild the browse URL for a saved search so the dashboard can link back to it.
export function searchToHref(kind: SearchKind, params: SearchParams): string {
  const path = kind === "directory" ? "/directory" : "/marketplace";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

// The alert core: which result keys are new relative to what we've already
// notified. Order-preserving, deduped.
export function newKeys(resultKeys: string[], seenKeys: string[]): string[] {
  const seen = new Set(seenKeys);
  const out: string[] = [];
  for (const key of resultKeys) {
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}
