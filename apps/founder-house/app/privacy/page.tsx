import { Brand, Footer } from "../house";
export default function Privacy() {
  return (
    <>
      <div className="subheader">
        <header className="header wrap">
          <Brand />
          <a href="/">Back to the House ↗</a>
        </header>
      </div>
      <main className="wrap subpage legal-content">
        <div className="section-label">LAST UPDATED · 24 OCTOBER 2026</div>
        <h1>Privacy notice</h1>
        <p>
          Founder House is a community operated by TRUVIS INTERNATIONAL
          SERVICES, Abu Dhabi. This notice describes this early membership
          website.
        </p>
        <h2>What we collect</h2>
        <p>
          We collect your name, email, phone, city, professional role,
          organisation, personal LinkedIn link or PDF CV, introduction,
          interests, what you can offer and what you need. Optional referral and
          discovery-source details help us understand community growth. We
          record your membership consent, optional news preference, review
          status, event RSVPs and the times of these actions.
        </p>
        <h2>Why we use it</h2>
        <p>
          We use this information to review applications, manage approved
          membership, organise relevant gatherings, communicate membership
          decisions and invitations, and prevent misuse. We send optional
          community news only if you opt in. Applying is free and does not
          create an investment or advisory engagement.
        </p>
        <h2>Who sees it</h2>
        <p>
          Your application and CV are restricted to authorised organisers. We do
          not publish a public member directory, sell applicant details, or send
          your CV to investors. Introductions and any future profile sharing
          require your agreement. Event listing integrations receive event
          information, not your membership application or CV.
        </p>
        <h2>Hosting and service providers</h2>
        <p>
          This website uses managed hosting, database and file-storage services,
          which may process information outside the UAE. Access is restricted at
          the application and platform level. When you follow links to other
          event platforms, their own privacy notices apply. A private member
          link acts as an access credential; keep it confidential.
        </p>
        <h2>Retention and your choices</h2>
        <p>
          We retain applications only while needed for review, membership
          operations and legitimate record-keeping. You can ask us to withdraw
          an application, correct information, stop optional updates, or delete
          personal information by emailing info@truvis.info. We will explain any
          records that must be kept for a specific obligation. You can request
          details about service providers and international processing before
          applying.
        </p>
        <h2>Cookies and local data</h2>
        <p>
          The member area uses an essential, secure, HTTP-only cookie to
          maintain access. Organiser sign-in uses the existing TRUVIS Supabase
          Auth service. This launch does not include advertising trackers or a
          public analytics pixel. Fonts are served by this website; no Google
          Fonts request is needed.
        </p>
        <h2>Contact</h2>
        <p>
          <a href="mailto:info@truvis.info">info@truvis.info</a>
          <br />
          TRUVIS INTERNATIONAL SERVICES
          <br />
          Level 36, Tower 3, Etihad Towers, Abu Dhabi, UAE.
        </p>
      </main>
      <Footer />
    </>
  );
}
