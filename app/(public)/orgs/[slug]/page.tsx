import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Organization ${slug}` };
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PlaceholderPage
      title={`Organization profile: ${slug}`}
      phase="Phase 2"
      description="Verified profile with contact person, catalog, posts, and upcoming events. Renders only while the organization's compliance standing allows visibility. (PRD: DIR-1, DIR-6)"
    />
  );
}
