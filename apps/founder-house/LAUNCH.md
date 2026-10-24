# Community launch plan

Founder House is a curated community, initially in Abu Dhabi. The website does not claim a permanent clubhouse, accommodation, existing member count or confirmed event dates.

## Membership

Applications include professional role, organisation, contact details, LinkedIn or private CV, current work, contribution and event preferences. An optional ask and referral make relevant introductions easier. The team personally reviews applications; there is no automated ranking of people. Application is free. Any membership terms or event costs are disclosed before a commitment.

Approved members receive private access. Each event requires a separate RSVP. Public listings support discovery, while Founder House controls membership and final confirmations. Investor introductions require mutual agreement; no funding or outcome is promised.

## Proposed first six weeks

These are recommendations, not scheduled events or promised attendance.

- Build a balanced founding circle of active founders, relevant investors and contributing operators.
- Establish one repeatable weekly breakfast, with a proposed 12–16 seats. Add small peer circles of 6–10 and a sport gathering every other week as host and venue availability allow.
- Group around shared challenges and interests. Make a few useful, consensual introductions instead of collecting indiscriminate contacts.
- Encourage members to introduce one relevant peer through the referral field. Apply the same review criteria to referrals.
- Confirm dates, hosts, costs and venue before publication. Use member interests to target invitations. Ask attendees to release places if their plans change; the event waitlist promotes eligible members automatically.
- Track invitation-to-RSVP, confirmed-to-attended, repeat attendance, accepted introductions and referral relevance. Attendance tracking and automatic reminders are future integrations, not active launch claims.
- Add an opt-in directory, startup opportunities and investor-thesis matching after the community has a reliable rhythm and explicit profile-sharing consent.

## Technical operation

The application lives in `apps/founder-house`, deployed as a separate Vercel project. Supabase Auth, the database and administrator roles are shared with TRUVIS.info. Application tables are namespaced `fh_`; CVs are private. The project-bound Edge Function owns backend operations. The Vercel app needs only public Supabase configuration and never receives a service-role credential.

Publication accounts and email delivery remain unconnected. Organisers can create and manage events and copy member invitations. The app attempts configured channels automatically when an event is published or changed. Luma and Meetup adapters and the Eventbrite/LinkedIn workflow contract still need organiser account connections and live tests. Do not advertise live simultaneous external publication until those tests succeed.

## Reference research

- https://foundersrc.com/ — recurring social sport and founder conversations.
- https://www.founderss.club/ — curated founder membership and small gatherings.
- https://www.council.club/founders — practical peer conversations.
- https://design.google/library/expressive-material-design-google-research — colour, shape, size, motion and containment supporting a clear task.
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html — measurable text contrast requirements.
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — measurable control sizing requirements.
