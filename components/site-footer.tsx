import Link from "next/link";
import Image from "next/image";
import { Mail, Globe, ShieldCheck } from "lucide-react";

const linkClass =
  "text-sm text-white/60 hover:text-white transition-colors rounded-sm";

const ecosystem = [
  { href: "https://truvis.ae/", label: "Corporate Advisory" },
  { href: "https://hub.truvis.ae/", label: "Jurisdiction Hub" },
  { href: "https://prop.truvis.ae/", label: "Business Presence" },
  { href: "https://licensing.truvis.ae/", label: "Financial Licensing" },
  { href: "https://truvis.tech/", label: "Technology" },
];

// Modeled on hub.truvis.ae's footer (JurisdictionDecisionHub Footer.tsx).
export function SiteFooter() {
  return (
    <footer className="bg-petroleum text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image src="/brand/logo.png" alt="" width={36} height={36} className="shrink-0" />
              <div className="font-display text-lg font-bold tracking-tight text-white">
                TRUVIS<span className="text-emerald-brand">.info</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              The verified business network — directory, events, and a
              marketplace where every organization maintains compliance
              standing.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-brand">
              <ShieldCheck className="size-4" aria-hidden />
              Continuously vetted via Truvis Compliance
            </p>
          </div>

          {/* Platform */}
          <nav aria-label="Platform">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/directory" className={linkClass}>Business Directory</Link></li>
              <li><Link href="/events" className={linkClass}>Events</Link></li>
              <li><Link href="/marketplace" className={linkClass}>Marketplace</Link></li>
              <li><Link href="/feed" className={linkClass}>Updates Feed</Link></li>
              <li><Link href="/pricing" className={linkClass}>Pricing</Link></li>
            </ul>
          </nav>

          {/* For organizations */}
          <nav aria-label="For organizations">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
              For Organizations
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className={linkClass}>Get listed</Link></li>
              <li><Link href="/dashboard" className={linkClass}>Organization dashboard</Link></li>
              <li>
                <a
                  href="https://compliance.truvis.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Compliance platform
                </a>
              </li>
              <li><Link href="/dashboard/events" className={linkClass}>Host an event</Link></li>
              <li><Link href="/dashboard/listings" className={linkClass}>List an opportunity</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-emerald-brand" aria-hidden />
                <a href="mailto:info@truvis.ae" className={linkClass}>info@truvis.ae</a>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="mt-0.5 size-4 shrink-0 text-emerald-brand" aria-hidden />
                <a href="https://www.truvis.ae" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  www.TRUVIS.ae
                </a>
              </li>
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-gray-500">
              Truvis.info is an introduction service only; it does not provide
              investment advice, broker transactions, or hold client funds.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-400 md:flex-row">
            <p>© {new Date().getFullYear()} TRUVIS International Services. Licensed Corporate Services Provider.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="https://truvis.ae/privacy-policy/" target="_blank" rel="noopener noreferrer" className={linkClass}>Privacy Policy</a>
              <a href="https://truvis.ae/terms-and-conditions/" target="_blank" rel="noopener noreferrer" className={linkClass}>Terms &amp; Conditions</a>
              <a href="https://truvis.ae/cookie-policy/" target="_blank" rel="noopener noreferrer" className={linkClass}>Cookie Policy</a>
              <a href="https://truvis.ae/disclaimer/" target="_blank" rel="noopener noreferrer" className={linkClass}>Disclaimer</a>
            </div>
          </div>
        </div>

        {/* Ecosystem pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5">
          {ecosystem.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block whitespace-nowrap rounded-full border border-white/[0.22] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 transition-all hover:-translate-y-px hover:border-cyan-accent hover:text-cyan-accent"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
