import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, ShieldCheck } from "lucide-react";

const linkClass =
  "text-sm text-white/62 transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="bg-[#1c1c1e] text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-10 border-b border-white/12 pb-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_.9fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
              <div className="font-display text-xl font-bold tracking-[-0.02em]">
                TRUVIS<span className="text-[#6fc5a3]">.info</span>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/62">
              A verified business network for discovering organizations,
              professional events and selected opportunities with more
              confidence.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#6fc5a3]">
              <ShieldCheck className="size-4" aria-hidden />
              Verified through Truvis Compliance
            </p>
          </div>

          <nav aria-label="Platform">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
              Platform
            </h2>
            <ul className="mt-5 space-y-3">
              <li><Link href="/directory" className={linkClass}>Directory</Link></li>
              <li><Link href="/events" className={linkClass}>Events</Link></li>
              <li><Link href="/marketplace" className={linkClass}>Marketplace</Link></li>
              <li><Link href="/feed" className={linkClass}>Network feed</Link></li>
              <li><Link href="/pricing" className={linkClass}>Pricing</Link></li>
            </ul>
          </nav>

          <nav aria-label="TRUVIS ecosystem">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
              TRUVIS
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a href="https://truvis.ae/" className={linkClass}>
                  Corporate services
                </a>
              </li>
              <li>
                <a href="https://hub.truvis.ae/" className={linkClass}>
                  Jurisdiction hub
                </a>
              </li>
              <li>
                <a href="https://licensing.truvis.ae/" className={linkClass}>
                  Financial licensing
                </a>
              </li>
              <li>
                <a href="https://truvis.tech/" className={linkClass}>
                  Technology
                </a>
              </li>
              <li>
                <a href="https://compliance.truvis.tech/" className={linkClass}>
                  Compliance
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
              Contact
            </h2>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#6fc5a3]" aria-hidden />
                <a href="mailto:info@truvis.ae" className={linkClass}>
                  info@truvis.ae
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm leading-6 text-white/62">
                <MapPin className="mt-1 size-4 shrink-0 text-[#6fc5a3]" aria-hidden />
                Abu Dhabi, United Arab Emirates
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 font-display text-sm font-semibold text-petroleum transition hover:bg-[#faf7f5]"
            >
              Get listed
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-8 text-xs leading-5 text-white/48 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p>
              © {new Date().getFullYear()} TRUVIS International Services.
              Licensed Corporate Services Provider.
            </p>
            <p className="mt-2">
              Truvis.info provides discovery and introductions only. It does
              not provide investment advice, broker transactions or hold
              client funds.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="https://truvis.ae/privacy-policy/" className={linkClass}>
              Privacy
            </a>
            <a href="https://truvis.ae/terms-and-conditions/" className={linkClass}>
              Terms
            </a>
            <a href="https://truvis.ae/cookie-policy/" className={linkClass}>
              Cookies
            </a>
            <a href="https://truvis.ae/disclaimer/" className={linkClass}>
              Disclaimer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
