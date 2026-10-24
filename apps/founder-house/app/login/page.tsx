import { Brand, Footer } from "../house";
import { signIn } from "./actions";
import { LoginSubmit } from "./submit";
export const metadata = { title: "Organiser sign in | Founder House" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <div className="subheader">
        <header className="header wrap">
          <Brand />
          <a href="/">Back to the House ↗</a>
        </header>
      </div>
      <main className="wrap subpage legal-content">
        <div className="section-label">THE ORGANISER DESK</div>
        <h1>Welcome back.</h1>
        <p>
          Sign in with your TRUVIS organiser account to review applications and
          manage events.
        </p>
        <form className="admin-form login-form" action={signIn}>
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              placeholder="you@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <LoginSubmit />
          <p className="form-footnote">
            Need help signing in?{" "}
            <a href="mailto:info@truvis.info">Contact the team</a>.
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
