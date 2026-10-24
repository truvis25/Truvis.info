"use client";
export default function EventError({ reset }: { reset: () => void }) {
  return (
    <main className="wrap subpage">
      <h1>We couldn’t load this event.</h1>
      <p>Please try again in a moment.</p>
      <div className="hero-actions">
        <button className="button dark" onClick={reset}>
          Try again
        </button>
        <a className="button outline" href="/#events">
          Back to events
        </a>
      </div>
    </main>
  );
}
