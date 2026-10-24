import { Brand, Footer } from "../house";
import { signIn } from "./actions";
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
          Use your existing truvis.info account. Organiser access requires the
          platform administrator role.
        </p>
        <form className="admin-form" action={signIn}>
          <label>
            Email
            <input type="email" name="email" required autoComplete="email" />
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
          <button className="button dark" type="submit">
            Sign in to the organiser desk ↗
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
