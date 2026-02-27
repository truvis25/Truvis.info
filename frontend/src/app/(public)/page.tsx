import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { CompanyCard } from '@/components/company/CompanyCard';
import type { Metadata } from 'next';
import type { Company } from '@/types';

export const metadata: Metadata = {
  title: 'TruVis.info — Verified Business Directory',
  description: 'Discover verified businesses and trusted corporate partners. UAE\'s premier verified business ecosystem.',
};

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

async function getFeaturedCompanies(): Promise<Company[]> {
  try {
    const res = await fetch(`${API_URL}/public/featured`, {
      next: { revalidate: 3600 }, // ISR: 1 hour
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getStats(): Promise<{ total: number; verified: number; countries: number }> {
  try {
    const res = await fetch(`${API_URL}/public/stats`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { total: 0, verified: 0, countries: 0 };
    return res.json();
  } catch {
    return { total: 0, verified: 0, countries: 0 };
  }
}

export default async function HomePage() {
  const [featured, stats] = await Promise.all([getFeaturedCompanies(), getStats()]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-16 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(201,168,76,0.3) 0%, transparent 60%),
                              radial-gradient(circle at 80% 20%, rgba(201,168,76,0.2) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="section-container py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-gold-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              Trusted by businesses across the UAE & beyond
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              The Verified Business{' '}
              <span className="text-gold-400">Ecosystem</span>
            </h1>

            <p className="text-lg text-white/80 mb-10 leading-relaxed max-w-2xl">
              TruVis.info is the authoritative directory of companies that have been vetted,
              verified, and trusted by TruVis Corporate Services. Every listing tells a verified story.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/directory" className="btn-gold text-base px-8 py-3">
                Explore Directory
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-colors">
                List Your Company
              </Link>
            </div>
          </div>

          {/* Stats */}
          {(stats.total > 0) && (
            <div className="flex gap-12 mt-16 pt-12 border-t border-white/10">
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.total}+</div>
                <div className="text-sm text-white/60 mt-1">Listed Companies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.verified}+</div>
                <div className="text-sm text-white/60 mt-1">TruVis Verified</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.countries}+</div>
                <div className="text-sm text-white/60 mt-1">Countries</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Companies */}
      {featured.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-navy-900">Featured Companies</h2>
                <p className="text-gray-500 mt-1">Premium verified listings on TruVis.info</p>
              </div>
              <Link href="/directory?featured=true" className="btn-ghost text-sm">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featured.slice(0, 8).map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why TruVis */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-navy-900 mb-3">Why TruVis Verification Matters</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              In a world of unverified claims, TruVis provides the trust infrastructure businesses need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '★',
                title: 'TruVis Verified',
                desc: 'Companies that have undergone our comprehensive verification process — license confirmation, document review, and quality assessment.',
              },
              {
                icon: '✔',
                title: 'TruVis Client',
                desc: 'Businesses that have an existing or past engagement with TruVis Corporate Services, confirming a direct professional relationship.',
              },
              {
                icon: '🏢',
                title: 'Curated Ecosystem',
                desc: 'Every listed company has been manually reviewed. We do not accept automated submissions — quality is our non-negotiable standard.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 rounded-xl border border-gray-100 hover:border-gold-200 hover:shadow-card transition-all">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-900">
        <div className="section-container text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to join the TruVis ecosystem?</h2>
          <p className="text-white/70 mb-8">
            List your company, complete your profile, and let TruVis verify your credentials.
          </p>
          <Link href="/register" className="btn-gold text-base px-10 py-3">
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="section-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-navy-900 rounded flex items-center justify-center">
              <span className="text-gold-500 font-bold text-xs">TV</span>
            </div>
            <span className="text-navy-900 font-semibold">TruVis.info</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/directory" className="hover:text-navy-900">Directory</Link>
            <Link href="/blog" className="hover:text-navy-900">Blog</Link>
            <Link href="/about" className="hover:text-navy-900">About</Link>
            <Link href="/privacy" className="hover:text-navy-900">Privacy</Link>
            <Link href="/terms" className="hover:text-navy-900">Terms</Link>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} TruVis Corporate Services
          </p>
        </div>
      </footer>
    </div>
  );
}
