import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <PlaceholderPage
      title="Business Marketplace"
      phase="Phase 4"
      description="Fundraising, equity and acquisition opportunities from verified organizations. Teasers are public; full detail requires a subscription and per-listing approval. (PRD: MKT-1..8)"
    />
  );
}
