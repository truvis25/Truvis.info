import { Brand, Footer } from "../house";
export default function Community() {
  return (
    <>
      <div className="subheader">
        <header className="header wrap">
          <Brand />
          <a href="/">Back to the House ↗</a>
        </header>
      </div>
      <main className="wrap subpage legal-content">
        <div className="section-label">THE WAY WE SHOW UP</div>
        <h1>Community principles</h1>
        <p>
          Founder House brings together people active in the startup ecosystem.
          These principles apply to applications, introductions, events and
          member access.
        </p>
        <h2>Bring a real connection to the ecosystem</h2>
        <p>
          Share accurate professional information. Tell us what you are
          building, investing in or contributing. We review for relevance and
          community balance, and may ask for clarification. Applying does not
          guarantee membership.
        </p>
        <h2>Help before you pitch</h2>
        <p>
          Listen, ask thoughtful questions and share useful experience. Do not
          use the room for unsolicited selling, recruitment blasts or aggressive
          fundraising. Exchange contact details only when both people want to.
        </p>
        <h2>Respect people and their privacy</h2>
        <p>
          Treat every member with respect. Harassment, discrimination and
          misrepresentation have no place here. Ask before taking photographs,
          recording conversations, forwarding contact information or sharing
          somebody’s business details.
        </p>
        <h2>Keep the room trusted</h2>
        <p>
          Member access is personal and cannot be transferred. Public event
          listings do not grant entry. Each event requires an approved
          membership and a confirmed place. Private venue details and member
          invitation links should not be posted publicly.
        </p>
        <h2>Show up, or release your place</h2>
        <p>
          Capacity is limited. If your plans change, cancel your RSVP so the
          team can offer the seat to somebody else. Dates, venues and any
          ticket, court or catering costs will be shared before a commitment.
        </p>
        <h2>Introductions, not investment promises</h2>
        <p>
          Community membership does not guarantee financing, returns, employment
          or business outcomes. Members make their own decisions and carry out
          their own checks. Personal introductions require agreement; no
          investment offer or transaction is made through this launch website.
        </p>
        <h2>Look after the community</h2>
        <p>
          Organisers may decline, pause or revoke membership or event access
          where information is inaccurate, conduct affects other members or the
          community fit changes. Raise concerns privately at{" "}
          <a href="mailto:info@truvis.info">info@truvis.info</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
