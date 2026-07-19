import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <PlaceholderPage
      title="Business Events"
      phase="Phase 3"
      description="Events hosted by verified organizations: register, get approved by the organizer, and manage your attendance. (PRD: EVT-1..7)"
    />
  );
}
