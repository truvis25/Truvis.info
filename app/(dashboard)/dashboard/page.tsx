import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      phase="Phase 2"
      description="Organization, user, and subscriber dashboards: profile status, catalog, posts, events and attendees, listings and applications. (PRD: DSH-1..3)"
    />
  );
}
