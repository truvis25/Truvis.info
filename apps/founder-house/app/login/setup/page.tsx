import { Brand, Footer } from "../../house";
import { serverClient } from "../../../lib/supabase";
import { InvitationForm } from "./form";

export const metadata = {
  title: "Set up your organiser account | Founder House",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const client = await serverClient();
  const { data: { user } } = await client.auth.getUser();
  return <>
    <div className="subheader"><header className="header wrap"><Brand /><a href="/">Back to the House ↗</a></header></div>
    <main className="wrap subpage legal-content">
      <div className="section-label">THE ORGANISER DESK</div>
      <h1>Make yourself at home.</h1>
      <p>Verify your invitation, then set your own sign-in password.</p>
      <InvitationForm verified={Boolean(user?.email_confirmed_at)} />
    </main>
    <Footer />
  </>;
}
