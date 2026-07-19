import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Directory" };

export default function DirectoryPage() {
  return (
    <PlaceholderPage
      title="Business Directory"
      phase="Phase 2"
      description="Browse and search compliance-verified organizations by industry, location, and size. (PRD: DIR-4, DIR-5)"
    />
  );
}
