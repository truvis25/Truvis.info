import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="Platform Administration"
      phase="Phase 5"
      description="Org registry with visibility overrides, moderation queue, compliance sync health, subscriptions, and audit log. (PRD: DSH-4, ADM-1..4)"
    />
  );
}
