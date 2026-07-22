import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { isPlatformAdmin } from "@/lib/admin/queries";
import {
  DashboardNav,
  type DashboardNavItem,
} from "@/components/dashboard-nav";

// Shared dashboard shell: a persistent, role-filtered sub-nav (DSH-1).
// Auth redirects stay in the pages; an anonymous visitor briefly sees the
// base nav before the page-level redirect to /login.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = user ? await getManagedOrg(supabase, user.id) : null;
  const admin = user ? await isPlatformAdmin(supabase, user.id) : false;

  const items: DashboardNavItem[] = [{ href: "/dashboard", label: "Overview" }];
  if (org) {
    items.push({ href: "/dashboard/profile", label: "Profile" });
    if (org.canManageContent) {
      items.push(
        { href: "/dashboard/catalog", label: "Catalog" },
        { href: "/dashboard/posts", label: "Posts" },
      );
    }
    if (org.canManageEvents) {
      items.push({ href: "/dashboard/events", label: "Events" });
    }
    if (org.role === "owner") {
      items.push({ href: "/dashboard/listings", label: "Listings" });
    }
  }
  items.push({ href: "/dashboard/applications", label: "Applications" });
  if (admin) items.push({ href: "/admin", label: "Admin" });

  return (
    <>
      <DashboardNav items={items} />
      {children}
    </>
  );
}
