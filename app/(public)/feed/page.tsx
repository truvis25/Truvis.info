import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <PlaceholderPage
      title="Updates Feed"
      phase="Phase 3"
      description="Announcements and updates from visible organizations, with followed organizations first. (PRD: POST-2)"
    />
  );
}
