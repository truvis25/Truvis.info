"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getComplianceClient } from "./client";

// Org claim flow (PRD AUTH-3 / CMP-1): fetch the publication grant + standing
// server-side from the compliance platform, then hand them to the
// claim_organization RPC (SECURITY DEFINER) which creates the org, owner
// membership, and standing cache in one transaction.
export async function claimOrganization(formData: FormData) {
  const complianceOrgId = String(formData.get("compliance_org_id") ?? "").trim();
  if (!complianceOrgId) {
    redirect(`/dashboard?claim_error=${encodeURIComponent("Enter your compliance organization ID.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const compliance = getComplianceClient();
  const [grant, standing] = await Promise.all([
    compliance.getPublicationGrant(complianceOrgId),
    compliance.getStanding(complianceOrgId),
  ]);

  if (!grant || grant.status !== "active") {
    redirect(
      `/dashboard?claim_error=${encodeURIComponent(
        "No active publication grant found for this organization. Authorize publication on compliance.truvis.tech first.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc("claim_organization", {
    p_compliance_org_id: complianceOrgId,
    p_grant: grant,
    p_standing: standing,
  });

  if (error) {
    redirect(`/dashboard?claim_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/directory");
  const slug = Array.isArray(data) ? data[0]?.claimed_org_slug : undefined;
  redirect(slug ? `/dashboard?claimed=${slug}` : "/dashboard");
}
